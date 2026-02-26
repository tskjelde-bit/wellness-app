/**
 * POST /api/session/generate
 *
 * Streams LLM-generated sentences as SSE events for a single phase.
 * Uses the 3-stage pipeline: streamLlmTokens -> chunkBySentence -> filterSafety.
 *
 * Called by the client-side useSessionOrchestrator hook per phase.
 *
 * SSE event format:
 *   data: {"sentence": "...", "index": N, "responseId": "..."}\n\n
 *   data: {"done": true, "totalSentences": N, "responseId": "..."}\n\n
 *   data: {"error": "..."}\n\n
 */

import { streamLlmTokens, chunkBySentence, filterSafety, getResolvedLlmSettings } from "@/lib/llm/generate-session";
import { buildPhaseInstructionsFromDb, getTransitionHintFromDb } from "@/lib/session/phase-prompts";
import { getMoodPromptFromDb } from "@/lib/session/mood-prompts";
import { buildCharacterPrompt } from "@/lib/llm/prompts";
import { getSessionBudgetsFromDb } from "@/lib/session/phase-config";
import { SESSION_PHASES, type SessionPhase } from "@/lib/session/phase-machine";

const VALID_SESSION_LENGTHS = [10, 15, 20, 30] as const;
const VALID_CHARACTERS = ["Thea", "Mari", "Milfen"] as const;

type ValidCharacter = (typeof VALID_CHARACTERS)[number];

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      phase,
      sessionLength,
      mood,
      character,
      previousResponseId,
      sentencesSoFar,
      isWindDown,
    } = body;

    // Validate phase
    if (!phase || !SESSION_PHASES.includes(phase as SessionPhase)) {
      return new Response(
        JSON.stringify({ error: "Invalid phase" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const validPhase = phase as SessionPhase;

    // Validate and default session length
    const length =
      typeof sessionLength === "number" &&
      VALID_SESSION_LENGTHS.includes(sessionLength as typeof VALID_SESSION_LENGTHS[number])
        ? sessionLength
        : 15;

    // Get LLM settings from DB config
    const llmSettings = await getResolvedLlmSettings();

    // Calculate max sentences for this phase (async DB-backed)
    const budgets = await getSessionBudgetsFromDb(length);
    const maxSentences = budgets[validPhase].sentenceBudget;

    // Build mood context (async DB-backed)
    const moodContext = mood ? await getMoodPromptFromDb(mood) : undefined;

    // Build character prompt
    const validatedCharacter: ValidCharacter | undefined =
      typeof character === "string" &&
      VALID_CHARACTERS.includes(character as ValidCharacter)
        ? (character as ValidCharacter)
        : undefined;
    const characterPrompt = validatedCharacter
      ? buildCharacterPrompt(validatedCharacter)
      : undefined;

    // Build transition hint if winding down (async DB-backed)
    const transitionHint = isWindDown
      ? await getTransitionHintFromDb(validPhase)
      : undefined;

    // Build full instructions (async DB-backed)
    const instructions = await buildPhaseInstructionsFromDb(
      validPhase,
      transitionHint,
      moodContext,
      characterPrompt,
    );

    // How many sentences already emitted in this phase
    const alreadyEmitted = typeof sentencesSoFar === "number" ? sentencesSoFar : 0;
    const remaining = Math.max(0, maxSentences - alreadyEmitted);

    // Create SSE stream
    const encoder = new TextEncoder();
    let responseId = previousResponseId ?? null;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stage 1: stream tokens from LLM (using DB-configured model/temperature)
          const tokens = streamLlmTokens(instructions, {
            model: llmSettings.model,
            temperature: llmSettings.temperature,
            previousResponseId: previousResponseId ?? undefined,
            instructions,
            onResponseId: (id: string) => {
              responseId = id;
            },
          });

          // Stage 2: chunk into sentences
          const sentences = chunkBySentence(tokens);

          // Stage 3: safety filter
          const safeSentences = filterSafety(sentences);

          let sentenceIndex = 0;

          for await (const sentence of safeSentences) {
            if (sentenceIndex >= remaining) break;

            const event = JSON.stringify({
              sentence,
              index: alreadyEmitted + sentenceIndex,
              responseId: responseId ?? undefined,
            });
            controller.enqueue(encoder.encode(`data: ${event}\n\n`));
            sentenceIndex++;
          }

          // Final done event
          const doneEvent = JSON.stringify({
            done: true,
            totalSentences: alreadyEmitted + sentenceIndex,
            responseId: responseId ?? undefined,
          });
          controller.enqueue(encoder.encode(`data: ${doneEvent}\n\n`));
        } catch (error) {
          console.error("[api/session/generate] Pipeline error:", error);
          const errorEvent = JSON.stringify({
            error: error instanceof Error ? error.message : "Generation failed",
          });
          controller.enqueue(encoder.encode(`data: ${errorEvent}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[api/session/generate] Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to start generation" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
