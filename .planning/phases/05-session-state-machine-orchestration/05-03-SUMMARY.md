---
phase: 05-session-state-machine-orchestration
plan: 03
subsystem: session
tags: [websocket, orchestrator-integration, phase-events, tts-per-sentence, message-types]

# Dependency graph
requires:
  - phase: 05-session-state-machine-orchestration
    plan: 02
    provides: SessionOrchestrator class with async generator run() yielding OrchestratorEvents
  - phase: 04-tts-audio
    provides: synthesizeSentence for per-sentence TTS synthesis
provides:
  - Extended ServerMessage with phase_start and phase_transition variants for client phase awareness
  - Orchestrator-integrated WebSocket handler replacing streamSessionAudio pipeline
  - Per-sentence TTS synthesis driven by orchestrator text events with prosody context
affects: [06-ui, 07-session-ux]

# Tech tracking
tech-stack:
  added: []
  patterns: [orchestrator-to-handler-event-routing, per-sentence-tts-in-ws-handler, dynamic-import-orchestrator]

key-files:
  created: []
  modified:
    - src/lib/ws/message-types.ts
    - src/lib/ws/session-handler.ts

key-decisions:
  - "Orchestrator yields text, handler drives TTS -- synthesizeSentence called per sentence in ws handler"
  - "previousText prosody context continues across phases (not reset) for voice continuity"
  - "Session length hardcoded to 15 minutes; Phase 7 adds client-selected length"
  - "Dynamic imports for @/lib/session and @/lib/tts/tts-service to avoid circular dependencies"

patterns-established:
  - "Event routing: orchestrator events mapped to ServerMessage types in handler switch"
  - "Per-sentence TTS: handler iterates synthesizeSentence audio chunks and sends binary frames"
  - "Prosody context: previousText accumulates across all phases for natural voice continuity"

requirements-completed: [SESS-01, SESS-06]

# Metrics
duration: 1min
completed: 2026-02-21
---

# Phase 5 Plan 03: WebSocket Handler Integration Summary

**Orchestrator-driven WebSocket handler routing phase_start/transition events to client and feeding per-sentence text through TTS synthesis with cross-phase prosody context**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-21T09:59:55Z
- **Completed:** 2026-02-21T10:01:09Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Extended ServerMessage discriminated union with phase_start and phase_transition variants for client phase awareness
- Replaced streamSessionAudio pipeline with SessionOrchestrator.run() generator in WebSocket handler
- Orchestrator events properly routed: phase_start to client, sentence through TTS to binary audio, phase_transition to client, session_complete to session_end, error to error message
- Removed local AudioChunkEvent type (no longer needed without direct TTS pipeline consumption)
- Maintained identical pause/resume/end/close/error behavior via same AbortController and pause gate patterns

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend WebSocket message types with phase events** - `8fd3292` (feat)
2. **Task 2: Refactor session handler to use SessionOrchestrator** - `d950b28` (feat)

## Files Created/Modified
- `src/lib/ws/message-types.ts` - Added phase_start and phase_transition variants to ServerMessage discriminated union
- `src/lib/ws/session-handler.ts` - Replaced streamSessionAudio with SessionOrchestrator, per-sentence TTS synthesis, phase event routing

## Decisions Made
- Orchestrator yields text events, handler calls synthesizeSentence directly -- this is the architecture per Research Open Question 3 and Plan 02 decision
- previousText for TTS prosody context accumulates across all phases without resetting, ensuring natural voice continuity throughout the entire session
- Session length hardcoded to 15 minutes as default; Phase 7 (Session UX & Controls) will add client-selected session length
- Dynamic imports used for both @/lib/session and @/lib/tts/tts-service to match existing pattern and avoid circular dependencies
- Phase fields use plain string types in message-types.ts (not SessionPhase) to keep the protocol layer dependency-free

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 5 complete: session state machine, orchestrator, and WebSocket integration all wired
- Client receives phase_start/phase_transition messages for UI phase indicators (Phase 6)
- Session length selection ready to be parameterized (Phase 7)
- Full pipeline: client connect -> session_start -> orchestrator phases -> TTS audio -> session_end

## Self-Check: PASSED

Both modified files verified on disk. Both task commits (8fd3292, d950b28) verified in git log.

---
*Phase: 05-session-state-machine-orchestration*
*Completed: 2026-02-21*
