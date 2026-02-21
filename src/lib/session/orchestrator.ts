/**
 * Session orchestrator -- drives multi-phase LLM generation with context chaining.
 *
 * The orchestrator makes sequential LLM calls per phase with distinct instructions,
 * chaining context via OpenAI `previous_response_id`. Each phase gets 1-2 LLM calls:
 * a main content call and an optional wind-down call with transition hints.
 *
 * Yields OrchestratorEvents (text-level, not audio). The WebSocket handler (Plan 03)
 * feeds text into the TTS pipeline separately.
 *
 * Phase state persists in Redis for crash recovery via setSessionState.
 */

import type { SessionPhase } from "./phase-machine";
import {
  getNextPhase,
  isTerminalPhase,
  getPhaseIndex,
  SESSION_PHASES,
} from "./phase-machine";
import { buildPhaseInstructions, TRANSITION_HINTS } from "./phase-prompts";
import { MOOD_PROMPTS } from "./mood-prompts";
import { getSessionBudgets, type PhaseConfig } from "./phase-config";
import {
  streamLlmTokens,
  chunkBySentence,
  filterSafety,
} from "@/lib/llm/generate-session";
import {
  getSessionState,
  setSessionState,
} from "@/lib/session-store";

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

export type OrchestratorEvent =
  | { type: "phase_start"; phase: SessionPhase; phaseIndex: number }
  | { type: "sentence"; text: string; phase: SessionPhase; index: number }
  | { type: "phase_transition"; from: SessionPhase; to: SessionPhase }
  | { type: "session_complete" }
  | { type: "error"; message: string };

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface OrchestratorOptions {
  sessionId: string;
  sessionLengthMinutes?: number;
  mood?: string;
}

// ---------------------------------------------------------------------------
// SessionOrchestrator
// ---------------------------------------------------------------------------

export class SessionOrchestrator {
  private readonly sessionId: string;
  private readonly sessionLengthMinutes: number;
  private readonly mood: string;
  private phase: SessionPhase;
  private previousResponseId: string | null;
  private sentencesInPhase: number;
  private totalSentences: number;
  private readonly phaseBudgets: Record<SessionPhase, PhaseConfig>;

  constructor(options: OrchestratorOptions) {
    this.sessionId = options.sessionId;
    this.sessionLengthMinutes = options.sessionLengthMinutes ?? 15;
    this.mood = options.mood ?? "neutral";
    this.phase = SESSION_PHASES[0]; // "atmosphere"
    this.previousResponseId = null;
    this.sentencesInPhase = 0;
    this.totalSentences = 0;
    this.phaseBudgets = getSessionBudgets(this.sessionLengthMinutes);
  }

  /**
   * Runs the full 5-phase session, yielding OrchestratorEvents.
   *
   * Each phase produces sentences via 1-2 LLM calls chained by previous_response_id.
   * When the sentence budget for a phase is reached, the orchestrator transitions
   * to the next phase. The session completes after the terminal phase finishes.
   */
  async *run(signal: AbortSignal): AsyncGenerator<OrchestratorEvent> {
    // Resolve mood context once for the entire session
    const moodContext = MOOD_PROMPTS[this.mood] ?? MOOD_PROMPTS["neutral"];

    try {
      while (true) {
        if (signal.aborted) return;

        const budget = this.phaseBudgets[this.phase];

        // Yield phase start event
        yield {
          type: "phase_start",
          phase: this.phase,
          phaseIndex: getPhaseIndex(this.phase),
        };

        // Persist state at phase start
        await this.persistState();

        // --- Main content call (sentences 0 to windDownAt) ---
        const mainInstructions = buildPhaseInstructions(this.phase, undefined, moodContext);
        const mainUserMessage = this.isFirstPhaseCall()
          ? "Begin the session."
          : `Continue. The session is now entering the ${this.phase} phase.`;

        const mainSentences = await this.streamPhaseSentences(
          mainInstructions,
          mainUserMessage,
          budget.windDownAt - this.sentencesInPhase,
          signal,
        );

        for (const text of mainSentences) {
          if (signal.aborted) return;
          this.sentencesInPhase++;
          this.totalSentences++;
          yield {
            type: "sentence",
            text,
            phase: this.phase,
            index: this.totalSentences - 1,
          };

          if (this.sentencesInPhase >= budget.sentenceBudget) break;
        }

        // --- Wind-down call (sentences windDownAt to sentenceBudget) ---
        if (
          !signal.aborted &&
          this.sentencesInPhase < budget.sentenceBudget &&
          this.sentencesInPhase >= budget.windDownAt
        ) {
          const hint = TRANSITION_HINTS[this.phase];
          const windDownInstructions = buildPhaseInstructions(
            this.phase,
            hint || undefined,
            moodContext,
          );
          const windDownUserMessage = "Continue.";
          const remaining = budget.sentenceBudget - this.sentencesInPhase;

          const windDownSentences = await this.streamPhaseSentences(
            windDownInstructions,
            windDownUserMessage,
            remaining,
            signal,
          );

          for (const text of windDownSentences) {
            if (signal.aborted) return;
            this.sentencesInPhase++;
            this.totalSentences++;
            yield {
              type: "sentence",
              text,
              phase: this.phase,
              index: this.totalSentences - 1,
            };

            if (this.sentencesInPhase >= budget.sentenceBudget) break;
          }
        }

        // --- Phase transition ---
        if (signal.aborted) return;

        const nextPhase = getNextPhase(this.phase);

        if (nextPhase === null) {
          // Terminal phase complete
          await this.persistState();
          yield { type: "session_complete" };
          return;
        }

        const fromPhase = this.phase;
        this.phase = nextPhase;
        this.sentencesInPhase = 0;

        yield { type: "phase_transition", from: fromPhase, to: nextPhase };

        // Persist state after transition
        await this.persistState();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown orchestrator error";
      yield { type: "error", message };
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Streams sentences for a single LLM call within a phase.
   *
   * Calls streamLlmTokens -> chunkBySentence -> filterSafety and collects
   * up to `maxSentences` results. Captures the response ID for chaining.
   */
  private async streamPhaseSentences(
    instructions: string,
    userMessage: string,
    maxSentences: number,
    signal: AbortSignal,
  ): Promise<string[]> {
    if (maxSentences <= 0) return [];

    const sentences: string[] = [];

    const tokens = streamLlmTokens("", {
      instructions,
      previousResponseId: this.previousResponseId ?? undefined,
      store: true,
      userMessage,
      signal,
      onResponseId: (id) => {
        this.previousResponseId = id;
      },
    });

    const chunked = chunkBySentence(tokens);
    const safe = filterSafety(chunked);

    for await (const sentence of safe) {
      if (signal.aborted) break;
      sentences.push(sentence);
      if (sentences.length >= maxSentences) break;
    }

    return sentences;
  }

  /** Returns true if this is the very first LLM call of the session. */
  private isFirstPhaseCall(): boolean {
    return this.totalSentences === 0 && this.previousResponseId === null;
  }

  /** Determines the transition state for the current phase. */
  private shouldTransition(
    sentencesInPhase: number,
    config: PhaseConfig,
  ): "continue" | "wind_down" | "transition" {
    if (sentencesInPhase >= config.sentenceBudget) return "transition";
    if (sentencesInPhase >= config.windDownAt) return "wind_down";
    return "continue";
  }

  /**
   * Persists the current orchestrator state to Redis.
   *
   * Reads the existing session state first to preserve consent flags
   * and other fields not managed by the orchestrator.
   */
  private async persistState(): Promise<void> {
    const existing = await getSessionState(this.sessionId);
    if (!existing) return; // No session to update

    const budgetValues: Record<SessionPhase, number> = {} as Record<
      SessionPhase,
      number
    >;
    for (const p of SESSION_PHASES) {
      budgetValues[p] = this.phaseBudgets[p].sentenceBudget;
    }

    await setSessionState(this.sessionId, {
      ...existing,
      currentPhase: this.phase,
      phaseStartedAt: Date.now(),
      sentencesInPhase: this.sentencesInPhase,
      totalSentences: this.totalSentences,
      previousResponseId: this.previousResponseId,
      phaseBudgets: budgetValues,
      sessionLengthMinutes: this.sessionLengthMinutes,
    });
  }
}
