---
phase: 05-session-state-machine-orchestration
plan: 01
subsystem: session
tags: [state-machine, fsm, prompts, phase-timing, wellness-session]

# Dependency graph
requires:
  - phase: 02-safety-consent
    provides: SAFETY_SYSTEM_PROMPT for prompt composition
  - phase: 03-llm-streaming
    provides: SESSION_PROMPT persona instructions for prompt composition
provides:
  - SessionPhase type and SESSION_PHASES const tuple (5-phase session definition)
  - Linear FSM utilities (getNextPhase, isTerminalPhase, getPhaseIndex)
  - Per-phase system prompt templates with distinct tone/pacing (PHASE_PROMPTS)
  - Transition hints for smooth phase wind-down (TRANSITION_HINTS)
  - buildPhaseInstructions() composing safety + persona + phase content
  - Configurable sentence budgets per session length (getSessionBudgets)
  - Phase proportions and wind-down thresholds (PHASE_PROPORTIONS, PhaseConfig)
affects: [05-02-session-orchestrator, 05-03-websocket-handler]

# Tech tracking
tech-stack:
  added: []
  patterns: [hand-rolled-fsm, const-tuple-derived-types, proportional-budget-scaling]

key-files:
  created:
    - src/lib/session/phase-machine.ts
    - src/lib/session/phase-prompts.ts
    - src/lib/session/phase-config.ts
    - src/lib/session/index.ts
  modified: []

key-decisions:
  - "Hand-rolled FSM with typed transitions table (~60 lines) instead of XState library"
  - "Phase proportions 0.12/0.20/0.28/0.25/0.15 for atmosphere/breathing/sensory/relaxation/resolution"
  - "SENTENCES_PER_MINUTE = 13 (~4.5s per sentence at natural wellness pacing)"
  - "Wind-down threshold at ~85% of phase budget (minimum 3 sentences before end)"
  - "Transition hints avoid end/finish/final to prevent premature session-ending language"

patterns-established:
  - "Const tuple type derivation: define const array, derive union type from it"
  - "Phase-keyed records: Record<SessionPhase, T> for type-safe phase lookups"
  - "Proportional budget scaling: fractions * total for configurable session lengths"

requirements-completed: [SESS-01, SESS-02, SESS-05]

# Metrics
duration: 3min
completed: 2026-02-21
---

# Phase 5 Plan 01: Session Phase Machine Summary

**Linear 5-phase FSM with typed transitions, per-phase prompt templates (distinct tone/pacing), and proportional sentence budgets scaling to 10-30 minute sessions**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-21T09:50:12Z
- **Completed:** 2026-02-21T09:52:45Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Session phase state machine with 5 forward-only phases (atmosphere through resolution)
- Rich per-phase prompt templates with distinct tone, pacing, and content guidance
- Resolution phase includes explicit grounding instructions (wiggle fingers/toes, notice room, open eyes)
- Transition hints avoid premature session-ending language (no "end"/"finish"/"final")
- Sentence budgets scale proportionally with session length (verified: 10min=131, 15min=195, 30min=391)
- Wind-down thresholds at ~85% of phase budget for smooth transitions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create phase state machine with typed transitions** - `c3e7132` (feat)
2. **Task 2: Create phase prompts, transition hints, timing config, and barrel exports** - `e28b216` (feat)

## Files Created/Modified
- `src/lib/session/phase-machine.ts` - SessionPhase type, SESSION_PHASES const, linear FSM transitions and utilities
- `src/lib/session/phase-prompts.ts` - Per-phase system prompts, transition hints, buildPhaseInstructions composer
- `src/lib/session/phase-config.ts` - PhaseConfig type, PHASE_PROPORTIONS, getSessionBudgets calculator
- `src/lib/session/index.ts` - Barrel exports for all session module public APIs

## Decisions Made
- Hand-rolled FSM with a typed transitions table (~60 lines) -- no library needed for a strictly linear state machine
- Phase proportions: atmosphere 12%, breathing 20%, sensory 28%, relaxation 25%, resolution 15% -- sensory gets the largest share as the core body-awareness phase
- SENTENCES_PER_MINUTE = 13 based on ~4.5s per sentence at natural wellness-guide speaking pace
- Wind-down reserve is max(3, round(budget * 0.15)) -- ensures at least 3 sentences of warning even in short phases
- Transition hints steer toward next phase topic without using termination language that could cause the LLM to prematurely end the session

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- SessionPhase type and all FSM utilities ready for Plan 02 (SessionOrchestrator)
- buildPhaseInstructions ready for composing per-phase LLM instructions
- getSessionBudgets ready for phase timing control in orchestrator
- All exports accessible via `@/lib/session` barrel import

## Self-Check: PASSED

All 4 created files verified on disk. Both task commits (c3e7132, e28b216) verified in git log.

---
*Phase: 05-session-state-machine-orchestration*
*Completed: 2026-02-21*
