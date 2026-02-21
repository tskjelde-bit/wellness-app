---
phase: 09-differentiators-polish
plan: 01
subsystem: session, tts
tags: [mood-adaptation, voice-selection, elevenlabs, websocket, orchestrator, prompts]

# Dependency graph
requires:
  - phase: 05-session-state-machine-orchestration
    provides: SessionOrchestrator, buildPhaseInstructions, session-handler pipeline
  - phase: 04-audio-pipeline-ws
    provides: TTS service with SynthesizeOptions.voiceId support
provides:
  - MOOD_OPTIONS and MOOD_PROMPTS for 5 mood states
  - VOICE_OPTIONS with 3 curated ElevenLabs voices and DEFAULT_VOICE_ID
  - WebSocket start_session protocol extended with mood and voiceId
  - Orchestrator mood injection into every LLM phase call
  - Session handler voiceId passthrough to TTS pipeline
affects: [09-differentiators-polish, client-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: [mood-context-injection-before-phase-instructions, voice-override-passthrough]

key-files:
  created:
    - src/lib/session/mood-prompts.ts
  modified:
    - src/lib/tts/elevenlabs-client.ts
    - src/lib/session/phase-prompts.ts
    - src/lib/session/index.ts
    - src/lib/ws/message-types.ts
    - src/lib/session/orchestrator.ts
    - src/lib/ws/session-handler.ts

key-decisions:
  - "Emily (LcfcDJNUP1GQjkzn1xUU) as DEFAULT_VOICE_ID replacing George for softer wellness default"
  - "Mood context inserted BEFORE CURRENT PHASE line for correct LLM attention recency (Research Pitfall 5)"
  - "moodContext resolved once in run() and passed to both main and wind-down buildPhaseInstructions calls"

patterns-established:
  - "Mood injection pattern: MOOD_PROMPTS[mood] -> moodContext string -> buildPhaseInstructions 3rd param"
  - "Voice override pattern: voiceId from WebSocket message -> synthesizeSentence options"

requirements-completed: [DIFF-01, DIFF-04]

# Metrics
duration: 2min
completed: 2026-02-21
---

# Phase 9 Plan 1: Mood Adaptation & Voice Selection Summary

**Server-side mood prompt injection for 5 emotional states and 3-voice ElevenLabs selection wired end-to-end through WebSocket, orchestrator, and TTS pipeline**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-21T11:33:15Z
- **Completed:** 2026-02-21T11:36:04Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Created mood-prompts.ts with 5 mood states (anxious, sad, stressed, neutral, restless) each with MOOD CONTEXT/EMPHASIS/TONE SHIFT prompt modifiers
- Added 3 curated VOICE_OPTIONS (Emily, Rachel, George) with DEFAULT_VOICE_ID to elevenlabs-client.ts
- Extended buildPhaseInstructions to accept optional moodContext parameter, inserted before phase-specific instructions for correct LLM attention ordering
- Wired mood through WebSocket -> session-handler -> orchestrator -> buildPhaseInstructions for every LLM call
- Wired voiceId through WebSocket -> session-handler -> synthesizeSentence for every TTS call

## Task Commits

Each task was committed atomically:

1. **Task 1: Create mood prompts and voice options config** - `9d13f0e` (feat)
2. **Task 2: Extend WebSocket protocol, orchestrator, and session handler for mood + voiceId** - `aba903f` (feat)

## Files Created/Modified
- `src/lib/session/mood-prompts.ts` - Mood options and prompt modifiers for 5 emotional states
- `src/lib/tts/elevenlabs-client.ts` - VOICE_OPTIONS array, VoiceOption interface, DEFAULT_VOICE_ID
- `src/lib/session/phase-prompts.ts` - buildPhaseInstructions extended with optional moodContext param
- `src/lib/session/index.ts` - Barrel exports for MOOD_OPTIONS and MOOD_PROMPTS
- `src/lib/ws/message-types.ts` - ClientMessage start_session extended with mood and voiceId
- `src/lib/session/orchestrator.ts` - OrchestratorOptions.mood, MOOD_PROMPTS import, moodContext injection
- `src/lib/ws/session-handler.ts` - Extract mood/voiceId from message, pass to orchestrator and TTS

## Decisions Made
- Emily (LcfcDJNUP1GQjkzn1xUU) replaces George as DEFAULT_VOICE_ID for a softer wellness default voice
- Mood context placed BEFORE the CURRENT PHASE line in prompt composition to maintain phase instructions as most-recent context (Research Pitfall 5 on LLM attention recency)
- moodContext resolved once at the start of run() and passed consistently to both main content and wind-down LLM calls

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Server-side mood and voice infrastructure complete
- Ready for Plan 02 (session length/theme config) and Plan 03 (client UI integration)
- A WebSocket client can now send `{ type: "start_session", mood: "anxious", voiceId: "21m00Tcm4TlvDq8ikWAM" }` and get mood-adapted prompts with Rachel's voice

## Self-Check: PASSED

- All 7 files verified present on disk
- Commit 9d13f0e (Task 1) verified in git log
- Commit aba903f (Task 2) verified in git log
- `npx tsc --noEmit` passes with no errors

---
*Phase: 09-differentiators-polish*
*Completed: 2026-02-21*
