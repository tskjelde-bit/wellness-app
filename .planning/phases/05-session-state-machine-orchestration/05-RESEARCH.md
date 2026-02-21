# Phase 5: Session State Machine & Orchestration - Research

**Researched:** 2026-02-21
**Domain:** Finite state machine for 5-phase wellness session flow, phase-specific LLM prompting, Redis session state, pipeline orchestration
**Confidence:** HIGH

## Summary

Phase 5 transforms the current single-prompt streaming pipeline into a structured 5-phase session flow (Atmosphere, Breathing, Sensory, Relaxation, Resolution). The orchestrator is a server-side state machine that manages phase progression, feeds phase-specific system prompts to the LLM, controls timing/pacing per phase, and persists session state in Redis for resilience.

The existing pipeline (`generateSession` -> `chunkBySentence` -> `filterSafety` -> `streamSessionAudio`) currently runs a single LLM call with one static prompt until the token stream ends. Phase 5 replaces this with an orchestrator that makes **multiple sequential LLM calls** -- one per phase -- with distinct `instructions` per phase. OpenAI's Responses API `previous_response_id` parameter chains these calls so the LLM retains full conversational context across phases, while the `instructions` parameter (which does NOT persist between chained responses) allows the system prompt to change on each phase transition. This is the key architectural insight: each phase gets its own `instructions` (tone, pacing, content guidance) while the model remembers everything it said in prior phases.

The state machine itself is simple enough to hand-roll in TypeScript (5 states, strictly linear progression with no branching or parallel states). XState would be overkill for a linear sequence with no complex guards or hierarchical states. A typed transitions table with an `onEnter`/`onExit` hook pattern provides all the structure needed while keeping the dependency footprint zero.

**Primary recommendation:** Build a `SessionOrchestrator` class that owns an FSM with 5 phase states, stores state in Redis (extending the existing `SessionState` interface), makes one LLM streaming call per phase using `previous_response_id` for context continuity and phase-specific `instructions`, and integrates with the existing `session-handler.ts` WebSocket lifecycle. Phase timing is managed by a combination of token budget per phase (derived from session length) and elapsed wall-clock time, with transitions triggered server-side when either limit is reached.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SESS-01 | Session follows 5-phase structured flow (Atmosphere -> Breathing -> Sensory -> Relaxation -> Resolution) | Hand-rolled FSM with typed `SessionPhase` enum (`atmosphere`, `breathing`, `sensory`, `relaxation`, `resolution`). Orchestrator advances through phases sequentially. Each phase triggers a separate LLM call with phase-specific `instructions`. See Architecture Pattern 1 (Phase State Machine) and Pattern 2 (Phase Prompt Templates). |
| SESS-02 | Each phase has distinct tone, pacing, and system prompt guidance | Phase prompt templates define per-phase `instructions` for the OpenAI Responses API. Atmosphere is warm/inviting, Breathing is rhythmic/counted, Sensory is intimate/descriptive, Relaxation is slow/deep, Resolution is grounding/gentle-return. `instructions` parameter does NOT persist between chained responses, so each phase's prompt is isolated. See Code Example: Phase Prompt Templates. |
| SESS-04 | Phase transitions occur naturally based on timing and content completion | Dual-trigger transition logic: (1) sentence count budget per phase (proportional to session length), and (2) the LLM stream completing naturally. The orchestrator counts sentences yielded per phase and advances when budget is reached. The final 1-2 sentences of each phase include a transition cue in the prompt ("begin winding down this phase"). No abrupt cuts -- the LLM is prompted to conclude naturally. See Architecture Pattern 3 (Transition Logic). |
| SESS-05 | Resolution phase provides grounding and gentle return to awareness | Resolution phase prompt template includes specific grounding instructions: wiggle fingers/toes, notice room sounds, open eyes slowly. The prompt instructs the LLM to bring the listener back to full awareness gradually. Resolution always runs as the final phase regardless of timing adjustments to earlier phases. See Code Example: Phase Prompt Templates (resolution section). |
| SESS-06 | Session state machine manages phase progression server-side via Redis | Extend existing `SessionState` interface in `session-store.ts` with `currentPhase`, `phaseStartedAt`, `sentencesInPhase`, `totalSentences`, `previousResponseId`, and `phaseBudgets`. Redis `set` with TTL (existing pattern) persists state. Orchestrator reads/writes state on each phase transition. See Architecture Pattern 4 (Redis Session State). |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `openai` | ^6.22.0 | OpenAI Responses API with `previous_response_id` for multi-turn phase chaining | Already installed. The `previous_response_id` parameter chains LLM calls across phases while allowing `instructions` to change per phase. `store: true` required for server-side response retention. Response ID available from `response.created` streaming event. |
| `@upstash/redis` | (installed) | Redis session state persistence for phase progression | Already installed. Extend existing `SessionState` interface with phase-specific fields. `redis.set()` with TTL pattern already established in `session-store.ts`. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none -- hand-roll FSM) | N/A | Session phase state machine | Always. 5 linear states with no branching -- a typed transitions table is ~30 lines. No library needed. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled FSM | XState v5 | XState adds ~50KB, actor model complexity, and its own TypeScript limitations. Our FSM is strictly linear (5 states, forward-only). XState shines for complex hierarchical/parallel states with guards -- massive overkill here. Hand-rolled is simpler, zero-dependency, and fully typed. |
| `previous_response_id` chaining | Manual conversation history in `input` array | Manually constructing the full message history works but requires storing/transmitting all prior messages. `previous_response_id` lets OpenAI handle context server-side. Downside: all prior input tokens are re-billed on each call. For 5 phases, this is ~5x cumulative billing. Acceptable for sessions of 10-30 minutes. |
| `previous_response_id` chaining | Single LLM call with phase instructions embedded in one prompt | A single long prompt saying "first do atmosphere, then breathing..." gives the LLM full control but provides no server-side phase tracking, no ability to intervene at transitions, no timing control, and no way to persist state across reconnections. Multiple calls with phase-specific instructions gives the server control over pacing and transitions. |
| Sentence count budget | Wall-clock timer only | Pure timer-based transitions would cut the LLM mid-sentence. Sentence counting lets us complete the current sentence/thought before transitioning. Timer is used as a secondary signal to adjust remaining phase budgets if the session is running long. |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── session/
│   │   ├── orchestrator.ts       # SessionOrchestrator class (FSM + pipeline driver)
│   │   ├── phase-machine.ts      # Phase FSM: states, transitions, hooks
│   │   ├── phase-prompts.ts      # Per-phase system prompt templates
│   │   ├── phase-config.ts       # Phase timing budgets, sentence targets
│   │   └── index.ts              # Barrel exports
│   ├── session-store.ts          # Extended SessionState with phase fields (existing file)
│   ├── llm/
│   │   ├── generate-session.ts   # Modified: accept previous_response_id + store
│   │   └── prompts.ts            # Modified: phase-aware buildSessionInstructions
│   └── ws/
│       └── session-handler.ts    # Modified: delegates to SessionOrchestrator
```

### Pattern 1: Phase State Machine (Hand-Rolled FSM)
**What:** A typed finite state machine with 5 linear states, forward-only transitions, and onEnter/onExit hooks.
**When to use:** Always -- this is the core session progression logic.

```typescript
// src/lib/session/phase-machine.ts

export const SESSION_PHASES = [
  "atmosphere",
  "breathing",
  "sensory",
  "relaxation",
  "resolution",
] as const;

export type SessionPhase = (typeof SESSION_PHASES)[number];

// Valid transitions: each phase can only advance to the next
const TRANSITIONS: Record<SessionPhase, SessionPhase | null> = {
  atmosphere: "breathing",
  breathing: "sensory",
  sensory: "relaxation",
  relaxation: "resolution",
  resolution: null, // terminal state
};

export interface PhaseTransitionResult {
  from: SessionPhase;
  to: SessionPhase | null;
  isComplete: boolean;
}

export function getNextPhase(current: SessionPhase): SessionPhase | null {
  return TRANSITIONS[current];
}

export function getPhaseIndex(phase: SessionPhase): number {
  return SESSION_PHASES.indexOf(phase);
}

export function isTerminalPhase(phase: SessionPhase): boolean {
  return TRANSITIONS[phase] === null;
}
```

### Pattern 2: Phase Prompt Templates
**What:** Per-phase `instructions` strings that define the LLM's tone, pacing, and content focus for each session phase.
**When to use:** Passed as the `instructions` parameter to each phase's LLM call.

```typescript
// src/lib/session/phase-prompts.ts

import { type SessionPhase } from "./phase-machine";

export const PHASE_PROMPTS: Record<SessionPhase, string> = {
  atmosphere: `
You are beginning a wellness session. Set the atmosphere.
TONE: Warm, welcoming, gentle. Like greeting someone into a safe space.
PACING: Moderate. Allow the listener to settle in.
CONTENT: Invite the listener to get comfortable. Describe the space as warm and safe.
  Suggest closing eyes. Paint a picture of calm surroundings.
  Use sensory language: soft light, warmth, gentle sounds.
LENGTH: 3-5 sentences per response. This phase is a gentle opening.
  `.trim(),

  breathing: `
You are guiding a breathing exercise. Focus on breath awareness.
TONE: Calm, rhythmic, measured. Your words should match breathing rhythm.
PACING: Slow. Leave space between instructions for actual breaths.
CONTENT: Guide specific breathing patterns (inhale counts, hold, exhale).
  Use phrases like "breathe in... and slowly out..."
  Count breaths. Notice the feeling of air entering and leaving.
LENGTH: 3-4 sentences per response. Keep instructions clear and spaced.
TRANSITION CUE: When nearing end, say something like "letting your breath
  find its own natural rhythm now..."
  `.trim(),

  sensory: `
You are guiding sensory awareness and body connection.
TONE: Intimate, descriptive, present. Speak as if very close to the listener.
PACING: Slow to moderate. Allow time to feel each sensation described.
CONTENT: Guide attention through body parts. Notice warmth, weight, texture.
  Describe sensations: tingling, heaviness, softness, warmth spreading.
  Use "notice how..." and "feel the..." phrases.
  Stay within body awareness -- never explicit, always wellness-focused.
LENGTH: 3-5 sentences per response. Rich sensory detail.
  `.trim(),

  relaxation: `
You are guiding deep relaxation. The listener is deeply settled.
TONE: Very soft, almost whispered. Deeply intimate and peaceful.
PACING: Very slow. Long pauses between ideas. Minimal words, maximum feeling.
CONTENT: Deepen the relaxation. Body is heavy and warm. Mind is quiet.
  Describe waves of calm, melting tension, floating sensation.
  Use imagery: warm light, gentle water, soft blankets.
LENGTH: 2-4 sentences per response. Less is more. Let silence work.
  `.trim(),

  resolution: `
You are gently ending the session. Bring the listener back to awareness.
TONE: Warm, grounding, reassuring. Like gently waking someone.
PACING: Gradually increasing from very slow to moderate.
CONTENT: Begin with gentle body awareness -- wiggle fingers and toes.
  Notice sounds in the room. Feel the surface beneath you.
  Suggest slowly opening eyes when ready. Affirm the experience.
  End with a warm closing -- carry this feeling with you.
LENGTH: 3-5 sentences per response. Gradual return to full awareness.
DO NOT: Rush. End abruptly. Use alarming language. Skip grounding steps.
  `.trim(),
};
```

### Pattern 3: Transition Logic (Dual-Trigger)
**What:** Phase transitions triggered by sentence count budget OR natural stream completion, whichever comes first.
**When to use:** Inside the orchestrator loop after each sentence is yielded.

```typescript
// Conceptual transition logic inside orchestrator

interface PhaseConfig {
  /** Target sentence count for this phase */
  sentenceBudget: number;
  /** When to start prompting the LLM to wrap up (sentences before budget) */
  windDownAt: number;
}

// For a 15-minute session (~200 sentences total at ~4.5s per sentence)
const PHASE_BUDGETS_15MIN: Record<SessionPhase, PhaseConfig> = {
  atmosphere:  { sentenceBudget: 25,  windDownAt: 20  }, // ~12%
  breathing:   { sentenceBudget: 40,  windDownAt: 35  }, // ~20%
  sensory:     { sentenceBudget: 55,  windDownAt: 48  }, // ~28%
  relaxation:  { sentenceBudget: 50,  windDownAt: 43  }, // ~25%
  resolution:  { sentenceBudget: 30,  windDownAt: 25  }, // ~15%
};

function shouldTransition(
  sentencesInPhase: number,
  config: PhaseConfig,
): "continue" | "wind_down" | "transition" {
  if (sentencesInPhase >= config.sentenceBudget) return "transition";
  if (sentencesInPhase >= config.windDownAt) return "wind_down";
  return "continue";
}
```

### Pattern 4: Redis Session State (Extended)
**What:** Extend the existing `SessionState` interface with phase-specific fields for server-side state persistence.
**When to use:** On every phase transition and periodically during phases for crash recovery.

```typescript
// Extended SessionState (modifies src/lib/session-store.ts)

export interface SessionState {
  userId: string;
  createdAt: number;
  // Phase 2 consent flags (existing)
  ageVerified: boolean;
  tosAccepted: boolean;
  sensoryConsentGiven: boolean;
  aiDisclosureShown: boolean;
  // Phase 5 orchestration state (new)
  currentPhase: SessionPhase;
  phaseStartedAt: number;
  sentencesInPhase: number;
  totalSentences: number;
  previousResponseId: string | null; // OpenAI response ID for context chaining
  phaseBudgets: Record<SessionPhase, number>; // sentence budgets per phase
  sessionLengthMinutes: number; // 10, 15, 20, or 30
}
```

### Pattern 5: Orchestrator Integration with Existing Pipeline
**What:** The `SessionOrchestrator` replaces the direct `streamSessionAudio(prompt)` call in `session-handler.ts`, driving the pipeline through multiple phases.
**When to use:** Called from the WebSocket handler when `start_session` is received.

```typescript
// Conceptual orchestrator flow

class SessionOrchestrator {
  private phase: SessionPhase = "atmosphere";
  private previousResponseId: string | null = null;
  private sentencesInPhase = 0;

  async *run(
    sessionId: string,
    signal: AbortSignal,
  ): AsyncGenerator<OrchestratorEvent> {
    while (!isTerminalPhase(this.phase) || this.sentencesInPhase === 0) {
      if (signal.aborted) return;

      // Get phase-specific instructions
      const instructions = buildPhaseInstructions(this.phase, this.getTransitionHint());

      // Stream LLM for this phase (with context from previous phases)
      for await (const sentence of generatePhaseContent(instructions, {
        previousResponseId: this.previousResponseId,
        signal,
      })) {
        this.sentencesInPhase++;
        yield { type: "sentence", text: sentence, phase: this.phase };

        // Check transition
        const action = shouldTransition(this.sentencesInPhase, this.getBudget());
        if (action === "transition") break; // exit inner loop, advance phase
      }

      // Capture response ID for context chaining
      // this.previousResponseId = captured from response.created event

      // Advance to next phase
      const nextPhase = getNextPhase(this.phase);
      if (nextPhase) {
        yield { type: "phase_transition", from: this.phase, to: nextPhase };
        this.phase = nextPhase;
        this.sentencesInPhase = 0;
        // Persist state to Redis
        await this.persistState(sessionId);
      }

      // Terminal phase completed
      if (isTerminalPhase(this.phase) && this.sentencesInPhase > 0) {
        yield { type: "session_complete" };
        return;
      }
    }
  }
}
```

### Pattern 6: Modified generateSession for Phase Chaining
**What:** Extend `generateSession` (or create a new `generatePhaseContent`) to accept `previousResponseId` and `store: true` for multi-turn chaining.
**When to use:** Called by the orchestrator once per phase.

```typescript
// Modified streamLlmTokens to support phase chaining

export async function* streamLlmTokens(
  phaseInstructions: string,
  options?: {
    model?: string;
    temperature?: number;
    previousResponseId?: string;
    onResponseId?: (id: string) => void; // Callback to capture response ID
  },
): AsyncGenerator<string> {
  const stream = await openai.responses.create({
    model: options?.model ?? DEFAULT_MODEL,
    instructions: phaseInstructions, // Phase-specific (does NOT persist)
    input: [{ role: "user", content: "Continue the session." }],
    temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
    max_output_tokens: MAX_OUTPUT_TOKENS,
    stream: true,
    store: true, // Required for previous_response_id chaining
    ...(options?.previousResponseId && {
      previous_response_id: options.previousResponseId,
    }),
  });

  for await (const event of stream) {
    if (event.type === "response.created") {
      // Capture response ID for next phase's chaining
      options?.onResponseId?.(event.response.id);
    }
    if (event.type === "response.output_text.delta") {
      yield event.delta;
    }
  }
}
```

### Anti-Patterns to Avoid

- **Single monolithic prompt for all phases:** "First do atmosphere, then breathing, then..." gives the LLM full control over pacing and transitions. The server has no ability to track phase progression, enforce timing, persist state, or resume after disconnection. Multiple calls with `previous_response_id` is strictly better.

- **Using XState or heavy FSM library for linear state:** Five states with forward-only transitions and no guards/parallel states. XState's actor model, hierarchical states, and event system are unnecessary complexity. A typed transition table is ~30 lines.

- **Abrupt phase transitions (cutting mid-sentence):** Never abort the LLM stream mid-sentence to force a transition. Instead, let the current sentence complete, then stop pulling from the generator. The "wind down" prompt hint in the last few sentences of each phase creates natural-sounding transitions.

- **Storing full conversation history in Redis:** Only store the `previousResponseId` (a string) -- OpenAI stores the actual conversation server-side (retained 30 days with `store: true`). Do not duplicate the conversation in Redis.

- **Re-creating the entire pipeline per phase:** The audio pipeline (`streamSessionAudio`) should be called once per phase, not reconstructed. The orchestrator drives multiple phases through the same WebSocket connection, yielding events continuously.

- **Timer-only transitions:** Wall-clock timers cut mid-thought. Use sentence counting as primary transition signal, with timer as secondary adjustment for overall session pacing.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-turn LLM context | Manual conversation history array | OpenAI `previous_response_id` | Server-side context management. No need to store/transmit prior messages. Instructions can change per call while context persists. |
| Phase timing estimation | Complex duration prediction | Sentence counting + proportional budgets | Audio duration correlates ~4-5 seconds per sentence. Counting sentences is simpler and more accurate than predicting LLM generation time. |
| Session state persistence | Custom database table | Extend existing `SessionState` in Redis with TTL | Pattern already established. JSON serialization via `@upstash/redis`. Auto-expiry via TTL. |
| Content safety | Per-phase safety filter | Existing `filterSafety` pipeline stage | The three-layer safety system from Phase 2 runs on every sentence regardless of phase. No phase-specific safety needed. |

**Key insight:** The hardest part of this phase is not the state machine (which is trivially simple) but the prompt engineering for each phase and the integration of `previous_response_id` chaining into the existing streaming pipeline. The orchestrator is glue code that connects well-understood pieces.

## Common Pitfalls

### Pitfall 1: previous_response_id Billing Amplification
**What goes wrong:** Each chained response re-processes all prior input tokens. By phase 5 (Resolution), the model is billed for all tokens from all 4 prior phases as input, plus the current phase's output.
**Why it happens:** `previous_response_id` makes OpenAI reconstruct the full conversation server-side, billing all prior tokens as input.
**How to avoid:** This is acceptable for v1. A 15-minute session generates roughly 800-1200 tokens of LLM output per phase. With 5 phases, cumulative input billing is ~Phase1 + 2*Phase1+Phase2 + 3*... = roughly 3x total output as input. At gpt-4.1-mini pricing ($0.40/1M input), this adds ~$0.003 per session. Monitor but do not optimize prematurely.
**Warning signs:** Unexpectedly high OpenAI bills. Track `usage` from `response.completed` events per phase.

### Pitfall 2: Lost previousResponseId on Reconnection
**What goes wrong:** Client disconnects and reconnects. The orchestrator lost the `previousResponseId` needed to chain the next phase's LLM call.
**Why it happens:** `previousResponseId` was only stored in-memory on the server.
**How to avoid:** Persist `previousResponseId` in Redis as part of `SessionState`. On reconnection, read it from Redis and resume from the current phase.
**Warning signs:** Reconnected sessions start from scratch with no context continuity.

### Pitfall 3: LLM Ignoring Phase Boundaries
**What goes wrong:** Despite phase-specific instructions, the LLM generates content that belongs to a different phase (e.g., doing body scan language during the Atmosphere phase).
**Why it happens:** The LLM's training data includes full meditation scripts where all phases blend together. With `previous_response_id`, it sees prior phase content and may continue the prior phase's patterns.
**How to avoid:** Make phase instructions very explicit: "You are NOW in the [phase] phase. Your ONLY focus is [specific content]. Do NOT discuss [prior phase topics]." Include a brief phase transition statement in the user input: "The session is now moving into the [phase] phase." Test prompts thoroughly.
**Warning signs:** Phase content feeling same-ish across all 5 phases.

### Pitfall 4: Wind-Down Prompt Causing Premature Conclusions
**What goes wrong:** The "wind down" hint added in the last few sentences of a phase causes the LLM to generate session-ending language ("and when you're ready, open your eyes") in the middle of the session.
**Why it happens:** The LLM interprets "begin wrapping up" as "end the entire session" rather than "conclude this phase."
**How to avoid:** Wind-down prompts must be phase-transition-specific, not session-ending: "Begin transitioning your guidance toward [next phase topic]. Let your words naturally shift from [current focus] to [next focus]." Never use words like "end," "finish," or "final" in non-Resolution phases.
**Warning signs:** Users report the session feeling like it's ending multiple times.

### Pitfall 5: Sentence Budget Mismatch with TTS Duration
**What goes wrong:** A phase with 40 sentences is estimated at ~3 minutes but actually takes 5 minutes because TTS synthesis adds latency, causing the total session to significantly exceed the target length.
**Why it happens:** Sentence budgets assume ~4.5s per sentence (TTS time + natural pauses), but actual TTS time varies with sentence length and ElevenLabs API latency.
**How to avoid:** Use sentence budgets as proportional guides, not exact timing. The orchestrator should track elapsed wall-clock time per phase as a secondary signal. If a phase is running long, reduce remaining phase budgets proportionally. Log actual sentences-per-minute to calibrate budgets over time.
**Warning signs:** Sessions consistently overshooting target duration.

### Pitfall 6: store: true Required but Not Set
**What goes wrong:** `previous_response_id` silently fails or errors because the prior response was not stored server-side.
**Why it happens:** The current `streamLlmTokens` does not pass `store: true`. Without it, the response is not retained and cannot be referenced.
**How to avoid:** Always set `store: true` when making LLM calls that will be chained. This is a required change to `generate-session.ts`.
**Warning signs:** "Response not found" errors on the second phase's LLM call.

## Code Examples

### Phase-Specific Instructions Builder

```typescript
// src/lib/session/phase-prompts.ts
import { SAFETY_SYSTEM_PROMPT } from "@/lib/safety";
import { SESSION_PROMPT } from "@/lib/llm/prompts";
import { PHASE_PROMPTS, type SessionPhase } from "./phase-machine";

/**
 * Build the complete instructions string for a specific phase.
 * Combines: safety prompt + base persona + phase-specific guidance + transition hint.
 */
export function buildPhaseInstructions(
  phase: SessionPhase,
  transitionHint?: string,
): string {
  const parts = [
    SAFETY_SYSTEM_PROMPT,
    SESSION_PROMPT,
    `\nCURRENT PHASE: ${phase.toUpperCase()}`,
    PHASE_PROMPTS[phase],
  ];

  if (transitionHint) {
    parts.push(`\nTRANSITION: ${transitionHint}`);
  }

  return parts.join("\n\n");
}
```

### Wind-Down Transition Hints

```typescript
// Transition hints injected when approaching phase budget limit

const TRANSITION_HINTS: Record<SessionPhase, string> = {
  atmosphere:
    "Begin naturally transitioning toward breath awareness. " +
    "Let your next words guide attention to the breath.",
  breathing:
    "Begin naturally shifting focus from breath to body awareness. " +
    "Let your guidance move from breathing rhythm to noticing physical sensations.",
  sensory:
    "Begin gently deepening the relaxation. " +
    "Let your words become softer and more spacious as you guide toward deep rest.",
  relaxation:
    "Begin the gentle process of bringing awareness back. " +
    "Start with subtle body sensations before suggesting return to the room.",
  resolution: "", // No transition from resolution -- it's terminal
};
```

### Orchestrator Event Types

```typescript
// Events yielded by the orchestrator to the WebSocket handler

export type OrchestratorEvent =
  | { type: "phase_start"; phase: SessionPhase; phaseIndex: number }
  | { type: "sentence"; text: string; phase: SessionPhase; index: number }
  | { type: "phase_transition"; from: SessionPhase; to: SessionPhase }
  | { type: "session_complete" }
  | { type: "error"; message: string };
```

### WebSocket Handler Integration Point

```typescript
// Modified session-handler.ts start_session case (conceptual)

case "start_session": {
  const orchestrator = new SessionOrchestrator({
    sessionId,
    sessionLengthMinutes: 15, // from client message, default 15
  });

  for await (const event of orchestrator.run(signal)) {
    if (signal.aborted) break;

    // Pause gate (existing pattern)
    while (isPaused && !signal.aborted) {
      await new Promise<void>((resolve) => { resumeResolve = resolve; });
    }

    switch (event.type) {
      case "phase_start":
        send(client, {
          type: "phase_start",
          phase: event.phase,
          phaseIndex: event.phaseIndex,
        });
        break;

      case "sentence":
        // Feed sentence through existing TTS pipeline
        // (orchestrator yields text; handler drives TTS)
        break;

      case "phase_transition":
        send(client, {
          type: "phase_transition",
          from: event.from,
          to: event.to,
        });
        break;

      case "session_complete":
        send(client, { type: "session_end" });
        break;
    }
  }
  break;
}
```

### Updated ServerMessage Types

```typescript
// New WebSocket message types for phase awareness

export type ServerMessage =
  | { type: "session_start"; sessionId: string }
  | { type: "text"; data: string; index: number }
  | { type: "sentence_end"; index: number }
  | { type: "phase_start"; phase: string; phaseIndex: number }     // NEW
  | { type: "phase_transition"; from: string; to: string }          // NEW
  | { type: "session_end" }
  | { type: "error"; message: string };
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single LLM call per session | Multi-call with `previous_response_id` chaining | Responses API (March 2025) | Enables per-phase prompt changes while maintaining conversational context. Instructions don't persist between chained responses (by design). |
| Chat Completions multi-turn (manual message array) | Responses API `previous_response_id` | March 2025 | Server-side context management. No need to store/transmit full conversation history. 30-day retention with `store: true`. |
| XState for all state machines | Hand-rolled FSM for simple linear flows | Ongoing best practice | XState v5 is powerful but adds complexity. For <10 states with no branching, a typed transition table is standard practice. |
| Client-side phase tracking | Server-side FSM with Redis persistence | This phase | Server authority over session progression. Client receives phase events but does not control transitions. Enables crash recovery and reconnection. |

**Deprecated/outdated:**
- Single-prompt session generation: The current `generateSession` approach works for Phase 4 (unstructured output) but cannot support structured phase transitions.
- `instructions` persistence assumption: Some early Responses API users assumed `instructions` persisted like `developer` role messages. They do not. This is a feature, not a bug, for our use case.

## Open Questions

1. **Sentence Budget Calibration**
   - What we know: A sentence averages ~4-5 seconds of TTS audio. A 15-minute session needs ~200 sentences total. Phase proportions (12/20/28/25/15%) are educated guesses from meditation script structures.
   - What's unclear: Actual sentences-per-minute with the gpt-4.1-mini + ElevenLabs pipeline. Sentence length varies.
   - Recommendation: Start with estimated budgets, log actual timing per phase, and calibrate after 10-20 test sessions. Make budgets configurable per session length (10/15/20/30 min).

2. **First Phase User Input**
   - What we know: The current pipeline sends `"Begin the session."` as the user message. With `previous_response_id`, subsequent phases could send `"Continue the session."` or a phase transition message.
   - What's unclear: Whether the user input message matters much when the `instructions` are detailed enough, and what the optimal first-turn vs. subsequent-turn user messages should be.
   - Recommendation: First phase: `"Begin the session."` Subsequent phases: `"Continue. The session is now entering the [phase name] phase."` Test whether explicit phase naming in user input helps the LLM follow phase instructions.

3. **TTS Pipeline Integration Point**
   - What we know: The orchestrator yields text sentences. The existing `streamSessionAudio` function runs `generateSession` -> TTS internally. The orchestrator replaces `generateSession` but still needs TTS synthesis.
   - What's unclear: Whether the orchestrator should yield raw text (and the handler drives TTS), or whether the orchestrator should integrate TTS internally and yield audio events.
   - Recommendation: Orchestrator yields text sentences with phase metadata. The session handler feeds these into a modified TTS pipeline. This keeps the orchestrator focused on phase logic and the handler focused on audio delivery. The existing `synthesizeSentence` function works per-sentence regardless of phase.

4. **Response Storage Retention**
   - What we know: `store: true` retains responses for 30 days. Our sessions are ephemeral by design (SAFE-07: no transcripts stored).
   - What's unclear: Whether 30-day retention of LLM responses on OpenAI's servers conflicts with the privacy requirement.
   - Recommendation: This needs a product decision. Options: (a) accept 30-day retention as an OpenAI infrastructure concern, not a "session transcript stored" concern, (b) call the delete endpoint after session completes, (c) use `store: false` and manage conversation context manually via input array. Option (a) is simplest; option (c) is most privacy-preserving but adds complexity.

5. **Pause Behavior Across Phase Transitions**
   - What we know: The current pause gate blocks the pipeline loop. If a user pauses near a phase boundary, the orchestrator may have already decided to transition but not yet started the next phase's LLM call.
   - What's unclear: Should pause prevent phase transitions, or should transitions still happen while paused (with the next phase's content buffered)?
   - Recommendation: Pause blocks everything including transitions. When resumed, the orchestrator continues from where it paused. This is simpler and matches user expectations (pause = freeze).

## Sources

### Primary (HIGH confidence)
- [OpenAI Responses API - Conversation State](https://developers.openai.com/api/docs/guides/conversation-state) - `previous_response_id` chaining, `store` parameter, context management
- [OpenAI Responses API Reference](https://platform.openai.com/docs/api-reference/responses/create) - Parameters: `instructions`, `previous_response_id`, `store`, `stream`
- [OpenAI Community - Developer Role Persistence](https://community.openai.com/t/will-developer-role-messages-persist-with-previous-response-id-in-responses-api/1313700) - Confirmed: `instructions` do NOT persist between chained responses; `developer` role messages in `input` DO persist
- [OpenAI Community - Streaming with previous_response_id](https://community.openai.com/t/responses-api-previous-response-id-while-streaming/1258193) - Confirmed: response ID available from `response.created` event during streaming
- Existing codebase: `src/lib/llm/generate-session.ts`, `src/lib/llm/prompts.ts`, `src/lib/ws/session-handler.ts`, `src/lib/session-store.ts`, `src/lib/tts/audio-pipeline.ts` (all read and analyzed)

### Secondary (MEDIUM confidence)
- [Making a State Machine in TypeScript](https://kbravh.dev/state-machine-in-typescript) - Hand-rolled FSM pattern with typed transitions table
- [State Machines in Practice](https://www.d4b.dev/blog/2026-01-04-state-machines-advantages-disadvantages) - When to use FSM vs. alternatives
- [XState v5 Documentation](https://stately.ai/docs/xstate) - Evaluated and ruled out for this use case
- [Body Scan Meditation - Berkeley](https://ggia.berkeley.edu/practice/body_scan_meditation) - Phase structure reference for wellness sessions
- [Calm Body Scan Guide](https://www.calm.com/blog/body-scan) - Session pacing and transition patterns
- [Coaching Tools Guided Meditation Scripts](https://www.thecoachingtoolscompany.com/de-stress-series-relax-clients-in-under-5-mins-guided-meditation-scripts/) - Phase timing proportions reference
- [Upstash Redis Session Management](https://upstash.com/blog/session-management-nextjs) - Redis state management patterns with TTL

### Tertiary (LOW confidence)
- Sentence budget proportions (12/20/28/25/15%): Estimated from general guided meditation script analysis, not validated with actual pipeline timing. Needs empirical calibration.
- Token cost estimates: Based on published gpt-4.1-mini pricing, but actual token counts per phase need measurement.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new dependencies. OpenAI SDK and Upstash Redis already installed. `previous_response_id` is documented and verified via community posts.
- Architecture: HIGH -- FSM pattern is well-understood. Multi-turn chaining via `previous_response_id` verified. Integration points with existing code clearly identified (session-handler.ts, generate-session.ts, session-store.ts, prompts.ts).
- Phase prompts: MEDIUM -- Prompt templates are reasonable first drafts based on meditation structure research, but need testing with actual LLM output to validate tone/pacing/transitions.
- Timing/budgets: LOW -- Sentence budgets are educated estimates. Actual timing depends on LLM generation speed, sentence length distribution, and TTS synthesis time. Must be calibrated empirically.
- Pitfalls: HIGH -- All pitfalls are based on verified API behaviors (billing, store requirement, instructions non-persistence) and established patterns from prior phases.

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (OpenAI API stable; Redis patterns stable; timing calibration needed within first week of testing)
