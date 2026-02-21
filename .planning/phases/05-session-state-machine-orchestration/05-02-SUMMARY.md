---
phase: 05-session-state-machine-orchestration
plan: 02
subsystem: session
tags: [orchestrator, llm-chaining, previous-response-id, async-generator, multi-phase, redis-state]

# Dependency graph
requires:
  - phase: 05-session-state-machine-orchestration
    plan: 01
    provides: SessionPhase FSM, buildPhaseInstructions, TRANSITION_HINTS, getSessionBudgets
  - phase: 03-llm-streaming
    provides: streamLlmTokens, chunkBySentence, filterSafety pipeline
  - phase: 04-tts-audio
    provides: Session-store SessionState interface
provides:
  - SessionOrchestrator class with async generator run() yielding OrchestratorEvents
  - Extended streamLlmTokens with previousResponseId, store, onResponseId, signal, userMessage, instructions
  - Extended SessionState with phase orchestration fields (currentPhase, sentencesInPhase, previousResponseId, etc.)
  - OrchestratorEvent discriminated union (phase_start, sentence, phase_transition, session_complete, error)
affects: [05-03-websocket-handler, 06-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: [previous-response-id-chaining, two-call-wind-down, async-generator-orchestration, merge-persist-state]

key-files:
  created:
    - src/lib/session/orchestrator.ts
  modified:
    - src/lib/llm/generate-session.ts
    - src/lib/session-store.ts
    - src/lib/session/index.ts

key-decisions:
  - "Single LLM call per phase main content, optional second call with transition hint for wind-down"
  - "store: true on every streamLlmTokens call to enable previous_response_id chaining (Research Pitfall 6)"
  - "Orchestrator yields text events, not audio -- WebSocket handler feeds text into TTS pipeline"
  - "Sentence counting is primary transition signal; no wall-clock timer in v1"
  - "Persist state via merge-read pattern: read existing SessionState, merge orchestrator fields, write back"

patterns-established:
  - "Two-call wind-down: main call without hint, second call with transition hint when windDownAt reached"
  - "Merge-persist: read existing Redis state, spread orchestrator fields on top, write back -- preserves consent flags"
  - "StreamLlmOptions interface: backward-compatible extension via optional fields"

requirements-completed: [SESS-04, SESS-06]

# Metrics
duration: 2min
completed: 2026-02-21
---

# Phase 5 Plan 02: Session Orchestrator Summary

**SessionOrchestrator driving 5-phase LLM generation with previous_response_id chaining, sentence-budget transitions, and Redis state persistence**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-21T09:55:11Z
- **Completed:** 2026-02-21T09:57:19Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Extended streamLlmTokens with 6 new optional parameters for multi-phase orchestration (backward-compatible)
- Extended SessionState with 7 phase orchestration fields for Redis crash recovery
- SessionOrchestrator drives sequential 5-phase flow with per-phase LLM calls chained via previous_response_id
- Wind-down transition hints injected via second LLM call when sentence budget nears limit
- All existing pipeline code (generateSession, chunkBySentence, filterSafety) untouched and backward-compatible

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend streamLlmTokens and SessionState** - `e1b6626` (feat)
2. **Task 2: Create SessionOrchestrator class** - `30d3085` (feat)

## Files Created/Modified
- `src/lib/session/orchestrator.ts` - SessionOrchestrator class with async generator run() method, OrchestratorEvent types
- `src/lib/llm/generate-session.ts` - Extended streamLlmTokens with StreamLlmOptions (previousResponseId, store, onResponseId, signal, userMessage, instructions)
- `src/lib/session-store.ts` - Extended SessionState with phase orchestration fields (currentPhase, sentencesInPhase, previousResponseId, phaseBudgets, etc.)
- `src/lib/session/index.ts` - Barrel exports updated to include SessionOrchestrator, OrchestratorEvent, OrchestratorOptions

## Decisions Made
- Single LLM call per phase main content, optional second call with transition hint for wind-down -- simplest viable approach per plan guidance
- store: true on every streamLlmTokens call to enable previous_response_id chaining (without it, second phase would get "Response not found" per Research Pitfall 6)
- Orchestrator yields text events only (not audio) -- WebSocket handler in Plan 03 feeds text into TTS pipeline
- Sentence counting as primary transition signal with no wall-clock timer in v1 (per research recommendation)
- Persist state via merge-read pattern: read existing SessionState from Redis, merge orchestrator fields on top, write back -- preserves consent flags and other non-orchestration fields

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- SessionOrchestrator ready for Plan 03 (WebSocket handler integration)
- OrchestratorEvents designed for WebSocket consumption: phase_start for UI updates, sentence for TTS pipeline, phase_transition for progress, session_complete for cleanup
- Extended StreamLlmOptions available for any future direct callers of streamLlmTokens
- All exports accessible via `@/lib/session` barrel import

## Self-Check: PASSED

All 4 files verified on disk. Both task commits (e1b6626, 30d3085) verified in git log.

---
*Phase: 05-session-state-machine-orchestration*
*Completed: 2026-02-21*
