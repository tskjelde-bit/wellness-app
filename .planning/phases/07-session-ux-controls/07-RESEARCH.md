# Phase 7: Session UX & Controls - Research

**Researched:** 2026-02-21
**Domain:** Client-side session controls, progress UI, conversational consent integration, session length selection
**Confidence:** HIGH

## Summary

Phase 7 is a UI/UX integration phase. The core infrastructure (WebSocket hooks, audio queue, phase machine, session orchestrator) is already complete from Phases 4-6. The key work is: (1) surfacing pause/resume/end controls in the session UI, (2) displaying the current phase as a progress indicator, (3) replacing the clinical SensoryConsent modal with a conversational flow woven into the session start, and (4) adding session length selection before beginning.

The existing codebase is remarkably well-prepared for this phase. The `useSessionWebSocket` hook already exposes `pause`, `resume`, `isPaused`, and `currentPhase` -- they are simply not consumed by the `SessionScreen` component. The `SessionOrchestrator` already accepts `sessionLengthMinutes` as a constructor parameter (currently hardcoded to 15 in `session-handler.ts`). The `start_session` client message type already supports a `prompt` field that could carry the session length selection. The SensoryConsent component already uses `onConsent/onSkip` callbacks designed for flexible integration.

**Primary recommendation:** Build all five success criteria as UI-only and protocol-extension work. No new server infrastructure is needed -- extend the `start_session` message to include `sessionLength`, add UI components for controls and progress, and refactor the pre-session screen into a multi-step flow (length selection, AI disclosure, sensory consent woven conversationally, then begin).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-03 | Basic playback controls (pause, resume, end session) | Hook already exposes `pause()`, `resume()`, `isPaused`; need UI buttons in session screen. Use AudioContext suspend/resume pattern already implemented in `use-audio-queue.ts`. |
| UI-04 | Phase progress indicator showing current session phase | `currentPhase` already tracked in `useSessionWebSocket` via `phase_start` and `phase_transition` messages. Need a visual indicator component mapping to 5 phases. |
| UI-06 | Consent flow woven conversationally into session start (not clinical modal) | Existing `SensoryConsent` component uses modal pattern. Refactor pre-session screen into stepped flow: AI disclosure text -> sensory consent as natural conversation step -> begin. Use `onConsent/onSkip` callbacks already on SensoryConsent. |
| UI-07 | Session length selection before starting | `SessionOrchestrator` already accepts `sessionLengthMinutes`. Extend `start_session` client message to include `sessionLength` field. Add UI selector (10/15/20/30 min) in pre-session screen. |
| SESS-03 | User can select session length (10 / 15 / 20 / 30 minutes) | `getSessionBudgets()` in `phase-config.ts` already calculates per-phase sentence budgets for any minute value. `session-handler.ts` line 109 has `sessionLengthMinutes: 15` hardcoded with comment "Phase 7 will add client-selected length". |
</phase_requirements>

## Standard Stack

### Core

No new libraries needed. This phase uses the existing stack:

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 | UI components, state management | Already in project |
| Tailwind CSS | 4.x | Styling controls, progress indicator | Already in project |
| next-ws / ws | 2.1.16 / 8.19 | WebSocket protocol extension | Already in project |

### Supporting

No additional libraries required. All UI controls are built with standard HTML/CSS/React patterns using the existing Tailwind theme.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom progress bar | Headless UI progress | Overkill for 5 static dots/steps; custom is simpler |
| Framer Motion for transitions | CSS transitions | CSS is sufficient for fade/slide between pre-session steps; no bundle cost |
| Stepper library | Custom step flow | Only 2-3 steps; library adds unnecessary dependency |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   └── session/
│       ├── session-screen.tsx       # MODIFY: Add controls, progress, pre-session flow
│       ├── breathing-orb.tsx        # KEEP: No changes needed
│       ├── session-controls.tsx     # NEW: Pause/resume/end button group
│       ├── phase-indicator.tsx      # NEW: 5-dot/step progress display
│       └── pre-session-flow.tsx     # NEW: Multi-step pre-session (length, consent, begin)
├── hooks/
│   └── use-session-ws.ts           # MODIFY: Pass sessionLength in start_session message
├── lib/
│   └── ws/
│       ├── message-types.ts        # MODIFY: Add sessionLength to start_session type
│       └── session-handler.ts      # MODIFY: Read sessionLength from client message
```

### Pattern 1: Surfacing Existing Hook State

**What:** The `useSessionWebSocket` hook already exposes `pause()`, `resume()`, `isPaused`, and `currentPhase`. The session-screen component currently only uses `connect`, `startSession`, `endSession`, `isConnected`, `isPlaying`, `currentText`, `sessionId`, `currentPhase`, and `error`. The `pause`, `resume`, and `isPaused` values are returned but never destructured in the component.

**When to use:** When infrastructure is already built and needs UI exposure.

**Example:**
```typescript
// session-screen.tsx -- current (Phase 6)
const {
  connect,
  startSession,
  endSession,
  isConnected,
  isPlaying,
  currentText,
  sessionId,
  currentPhase,
  error,
} = useSessionWebSocket();

// session-screen.tsx -- updated (Phase 7)
const {
  connect,
  startSession,
  pause,       // NEW: already exposed by hook
  resume,      // NEW: already exposed by hook
  endSession,
  isConnected,
  isPlaying,
  isPaused,    // NEW: already exposed by hook
  currentText,
  sessionId,
  currentPhase,
  error,
} = useSessionWebSocket();
```

### Pattern 2: Session Length via WebSocket Message Extension

**What:** Extend the `start_session` client message to carry `sessionLength`, and propagate it to the `SessionOrchestrator` constructor.

**When to use:** When the client needs to communicate a parameter to the server at session start.

**Example:**
```typescript
// message-types.ts -- extend start_session
export type ClientMessage =
  | { type: "start_session"; prompt?: string; sessionLength?: number }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "end" };

// session-handler.ts -- use client-provided length
case "start_session": {
  const sessionLength = message.sessionLength ?? 15;
  const orchestrator = new SessionOrchestrator({
    sessionId,
    sessionLengthMinutes: sessionLength,
  });
  // ...
}

// use-session-ws.ts -- pass length from UI
const startSession = useCallback((options?: { prompt?: string; sessionLength?: number }) => {
  if (wsRef.current?.readyState === WebSocket.OPEN) {
    wsRef.current.send(JSON.stringify({
      type: "start_session",
      prompt: options?.prompt,
      sessionLength: options?.sessionLength,
    }));
  }
}, []);
```

### Pattern 3: Multi-Step Pre-Session Flow

**What:** Replace the single "Begin Session" screen with a stepped flow: session length selection -> conversational consent (AI disclosure + sensory consent) -> begin. Each step is a state transition within the same component, not a route change.

**When to use:** When the user needs to make selections and provide consent before the main experience starts, but routing would break the immersive feel.

**Example:**
```typescript
// Pre-session flow states
type PreSessionStep = "length" | "consent" | "ready";

const [step, setStep] = useState<PreSessionStep>("length");
const [selectedLength, setSelectedLength] = useState<number>(15);

// Step 1: Length selection
// Step 2: Conversational consent (AI disclosure text + sensory consent in-line)
// Step 3: "Begin" button (connect + startSession with selected length)
```

### Pattern 4: Phase Progress Indicator

**What:** A minimal 5-dot/segment indicator showing which of the 5 phases is currently active. Uses the `currentPhase` string from the WebSocket hook mapped to `SESSION_PHASES` array indices.

**When to use:** When the user needs passive awareness of session progress without distracting from the voice-first experience.

**Example:**
```typescript
// phase-indicator.tsx
import { SESSION_PHASES, type SessionPhase } from "@/lib/session/phase-machine";

interface PhaseIndicatorProps {
  currentPhase: string | null;
}

export function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const activeIndex = currentPhase
    ? SESSION_PHASES.indexOf(currentPhase as SessionPhase)
    : -1;

  return (
    <div className="flex gap-2" role="progressbar" aria-valuenow={activeIndex + 1} aria-valuemax={5}>
      {SESSION_PHASES.map((phase, i) => (
        <div
          key={phase}
          className={`h-1.5 w-6 rounded-full transition-colors ${
            i <= activeIndex ? "bg-blush" : "bg-cream/20"
          }`}
          aria-label={`Phase ${i + 1}: ${phase}`}
        />
      ))}
    </div>
  );
}
```

### Pattern 5: Conversational Consent (Not Clinical Modal)

**What:** Instead of a separate modal or page for sensory consent, weave it into the pre-session flow as a conversational step. The AI disclosure text appears as narrative text, and the sensory consent question reads like an invitation rather than a legal checkbox.

**When to use:** When consent is required but clinical modals break immersion. The requirement explicitly states "not clinical modal" (UI-06).

**Example approach:**
```typescript
// Conversational consent step in pre-session flow
<div className="flex flex-col items-center gap-6 text-center">
  <p className="text-sm text-cream/70 max-w-sm leading-relaxed">
    Before we begin, I want you to know — I'm an AI wellness guide,
    here to help you relax. This isn't therapy, just a moment of calm.
  </p>
  <p className="text-sm text-cream/60 max-w-sm leading-relaxed">
    This session includes body awareness and sensory guidance.
    You're in control — you can pause or end at any time.
  </p>
  <div className="flex flex-col gap-3 w-full max-w-xs">
    <button onClick={handleConsent} className="...">
      I'm ready to begin
    </button>
    <button onClick={handleSkipSensory} className="...text-cream/40...">
      Skip sensory content
    </button>
  </div>
</div>
```

### Anti-Patterns to Avoid

- **Giant monolithic session-screen:** Don't put all new UI (controls, progress, pre-session flow) in a single component. Extract `SessionControls`, `PhaseIndicator`, and `PreSessionFlow` as separate components.
- **Blocking consent with full-page modals:** The requirement (UI-06) explicitly says "not clinical modal." The consent must feel conversational and integrated.
- **Re-creating AudioContext on pause/resume:** The existing pattern (`AudioContext.suspend()`/`.resume()`) is correct. Do not create a new AudioContext -- that would break gap-free scheduling.
- **Client-side session length validation only:** Validate the `sessionLength` value server-side too (must be one of 10/15/20/30). Reject invalid values.
- **Cluttering the voice-first experience:** The existing design decision (06-02) makes the End Session button intentionally tiny/subtle. New controls should follow this same minimal-chrome philosophy. Controls should be discoverable but not visually dominant.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Phase-to-index mapping | Manual index calculation | `SESSION_PHASES.indexOf()` + `getPhaseIndex()` from phase-machine.ts | Already implemented with type safety |
| Audio pause/resume | Custom audio node tracking | `AudioContext.suspend()`/`.resume()` via `useAudioQueue` hook | Already handles edge cases (queued buffers, scheduled nodes) |
| Session length budget calculation | Manual sentence counting | `getSessionBudgets(minutes)` from phase-config.ts | Already handles proportions, wind-down thresholds |
| WebSocket message parsing | Manual JSON.parse in handler | `parseClientMessage()` from message-types.ts | Already validates types, handles malformed input |

**Key insight:** This phase is almost entirely about connecting existing infrastructure to the UI. Nearly every "backend" piece is already built and tested. The work is UI components and a one-line protocol extension.

## Common Pitfalls

### Pitfall 1: Breaking AudioContext on User Interaction
**What goes wrong:** Adding a pause/resume button that creates a new AudioContext instead of suspending the existing one.
**Why it happens:** Developers think "pause" means stopping and restarting audio.
**How to avoid:** Use the existing `pause()` and `resume()` from `useSessionWebSocket`. They call `AudioContext.suspend()`/`.resume()` internally.
**Warning signs:** Audio gaps or failures after resuming. `decodeAudioData` errors.

### Pitfall 2: Race Condition on Session Start
**What goes wrong:** Sending `start_session` before the WebSocket is open, or calling `connect()` and `startSession()` synchronously.
**Why it happens:** The current code already handles this (useEffect waits for `isConnected`), but refactoring the pre-session flow could accidentally break it.
**How to avoid:** Keep the existing pattern: `connect()` in click handler, `startSession()` in useEffect that watches `isConnected`. Or use the existing guard: `if (wsRef.current?.readyState === WebSocket.OPEN)`.
**Warning signs:** "Session already streaming" error, or silent failure to start.

### Pitfall 3: Consent State Not Reaching Server
**What goes wrong:** Recording sensory consent client-side but not reflecting it in the Redis session state. The server orchestrator might skip sensory phase content without knowing consent was given.
**Why it happens:** The current sensory consent records to PostgreSQL audit log but does NOT update the Redis session state `sensoryConsentGiven` flag.
**How to avoid:** When wiring the conversational consent into the pre-session flow, ensure the server action (`recordSensoryConsent`) is still called. The session-handler already creates a session state in Redis at connection time. If the consent step happens before `start_session`, the consent record exists in PostgreSQL. However, the session-handler currently creates the Redis SessionState with default consent flags. Consider: either (a) set consent flags in the `start_session` message, or (b) look up consent status from DB when creating the session. Current pattern in session-handler.ts creates a SessionOrchestrator directly without setting Redis consent flags first, so this may already be a gap from Phase 5.
**Warning signs:** `sensoryConsentGiven: false` in Redis even after user consents.

### Pitfall 4: Session Length Not Validated Server-Side
**What goes wrong:** Client sends `sessionLength: 999` and the orchestrator generates an absurdly long session.
**Why it happens:** Trusting client input without validation.
**How to avoid:** Validate in `parseClientMessage` or the session handler. Allowed values: `[10, 15, 20, 30]`. Default to 15 if invalid.
**Warning signs:** Unexpectedly long sessions, high API costs.

### Pitfall 5: Visual Controls Distracting from Voice-First Experience
**What goes wrong:** Adding prominent playback controls that make the session feel like a media player rather than a wellness experience.
**Why it happens:** Following media player UX conventions instead of the project's voice-first, minimal-chrome design philosophy.
**How to avoid:** Follow the existing pattern from Phase 6: the "End Session" button is intentionally `text-xs text-cream/30` -- tiny and subtle. Pause/resume should be similarly unobtrusive. Consider a single tap-to-pause on the orb itself, or a minimal icon button near the bottom.
**Warning signs:** Users focus on controls rather than listening. The screen feels "busy."

### Pitfall 6: Phase Indicator Importing Server-Only Code
**What goes wrong:** Importing `SESSION_PHASES` from `@/lib/session/phase-machine` into a client component causes build errors if that module transitively imports server-only dependencies.
**Why it happens:** `phase-machine.ts` is a pure TypeScript module with no server imports, so this is currently safe. But if someone later adds an import to it, client components break.
**How to avoid:** `SESSION_PHASES` is just a `const` array. For the client-side phase indicator, either import directly (it's safe now) or define the phase names as a client-safe constant. The `phase-machine.ts` module has no server dependencies -- it only exports types and pure functions.
**Warning signs:** "Module not found" or "server-only" errors during client build.

## Code Examples

### Current Session Controls Flow (What Exists)

```typescript
// use-session-ws.ts already has these -- just not wired to UI:
const pause = useCallback(() => {
  pauseAudio();  // AudioContext.suspend()
  if (wsRef.current?.readyState === WebSocket.OPEN) {
    wsRef.current.send(JSON.stringify({ type: "pause" }));
  }
}, [pauseAudio]);

const resume = useCallback(() => {
  resumeAudio();  // AudioContext.resume()
  if (wsRef.current?.readyState === WebSocket.OPEN) {
    wsRef.current.send(JSON.stringify({ type: "resume" }));
  }
}, [resumeAudio]);
```

### Server-Side Pause Gate (Already Implemented)

```typescript
// session-handler.ts -- pause gate in streaming loop
while (isPaused && !controller.signal.aborted) {
  await new Promise<void>((resolve) => {
    resumeResolve = resolve;
  });
}
```

### Session Length Budget Calculation (Already Implemented)

```typescript
// phase-config.ts -- works for any minute value
const budgets = getSessionBudgets(10);  // 10 min session
// budgets.atmosphere.sentenceBudget ~= 16
// budgets.breathing.sentenceBudget ~= 26
// etc.

const budgets30 = getSessionBudgets(30); // 30 min session
// budgets30.atmosphere.sentenceBudget ~= 47
// budgets30.breathing.sentenceBudget ~= 78
// etc.
```

### Message Extension Pattern

```typescript
// message-types.ts -- extend parseClientMessage for sessionLength
case "start_session": {
  const sessionLength = typeof obj.sessionLength === "number" ? obj.sessionLength : undefined;
  return {
    type: "start_session",
    prompt: typeof obj.prompt === "string" ? obj.prompt : undefined,
    sessionLength,
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Clinical consent modals | Conversational, contextual consent | Ongoing UX trend | Better completion rates, less friction |
| Prominent media controls | Minimal, gesture-based controls | Voice-first design pattern | Reduced visual distraction for audio experiences |
| Fixed session lengths | User-selectable with dynamic pacing | Already built in phase-config.ts | Personalization without complexity |

**Deprecated/outdated:**
- None applicable -- this phase uses established React, CSS, and WebSocket patterns.

## Open Questions

1. **Sensory consent skip behavior**
   - What we know: SensoryConsent has `onSkip` callback. If skipped, the sensory phase could theoretically be shortened or softened.
   - What's unclear: When the user skips sensory consent, should the sensory phase be omitted entirely, or just toned down? The current orchestrator always runs all 5 phases.
   - Recommendation: For v1, run all 5 phases regardless but the sensory phase uses softer language if consent was skipped. Alternatively, skip sensory and redistribute its budget to relaxation. Leave this as a planning decision -- the protocol extension for `start_session` could include a `sensoryConsent: boolean` flag.

2. **Pause/resume visual state on the orb**
   - What we know: The breathing orb animates when `isPlaying` is true. When paused, audio stops but `isPlaying` state depends on AudioPlaybackQueue state.
   - What's unclear: Should the orb stop animating on pause? Should it show a different visual state?
   - Recommendation: When `isPaused` is true, stop the breathing animation (set `isPlaying` to false on the orb) and optionally dim it. This provides clear visual feedback.

3. **Where to position playback controls**
   - What we know: Current design has "End Session" as tiny text at bottom. Phase 6 decision: "End Session button intentionally tiny/subtle for voice-first minimal chrome."
   - What's unclear: Adding pause/resume alongside end -- should they all be at the bottom? Should the orb be tappable for pause/resume?
   - Recommendation: Place a subtle pause/play icon below the orb (centered), with end session remaining at the very bottom. Alternatively, make the orb itself tappable for pause/resume -- this is a common pattern in meditation apps and maintains minimal chrome.

## Sources

### Primary (HIGH confidence)
- Project source code (`session-screen.tsx`, `use-session-ws.ts`, `use-audio-queue.ts`, `session-handler.ts`, `orchestrator.ts`, `phase-machine.ts`, `phase-config.ts`, `message-types.ts`) -- directly examined all files
- Project decisions in `STATE.md` -- Phase 5 and Phase 6 decisions confirmed existing infrastructure

### Secondary (MEDIUM confidence)
- Web Audio API `suspend()`/`resume()` pattern -- standard API, well-documented at MDN
- Conversational consent UX pattern -- established UX practice for sensitive content

### Tertiary (LOW confidence)
- None -- this phase relies entirely on existing project code and standard web APIs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new libraries needed, all existing code examined
- Architecture: HIGH -- Clear integration points, code already prepared for this phase (TODO comments in session-handler.ts, proactive `currentPhase` tracking in Phase 6)
- Pitfalls: HIGH -- All pitfalls derived from direct code inspection of existing patterns and edge cases

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (stable -- no external dependencies to change)
