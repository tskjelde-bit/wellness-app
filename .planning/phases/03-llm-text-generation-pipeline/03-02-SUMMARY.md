---
phase: 03-llm-text-generation-pipeline
plan: 02
subsystem: llm
tags: [openai, responses-api, streaming, async-generator, pipeline, safety-filter, tts]

# Dependency graph
requires:
  - phase: 03-01
    provides: splitAtSentenceBoundaries sentence chunker for token accumulation
  - phase: 02
    provides: checkContentSafety three-layer safety filter and SAFETY_SYSTEM_PROMPT
provides:
  - generateSession composed async generator pipeline (LLM -> chunker -> safety)
  - streamLlmTokens OpenAI Responses API streaming with error fallback
  - chunkBySentence token-to-sentence accumulation
  - filterSafety per-sentence content safety enforcement
  - buildSessionInstructions prompt template combining safety + persona + context
  - SESSION_PROMPT wellness guide persona instructions
affects: [phase-4 tts integration, phase-5 session management]

# Tech tracking
tech-stack:
  added: []
  patterns: [three-stage async generator pipeline, yield* composition, module-level OpenAI singleton, streaming error fallback]

key-files:
  created:
    - src/lib/llm/prompts.ts
    - src/lib/llm/generate-session.ts
    - src/lib/llm/index.ts
  modified: []

key-decisions:
  - "gpt-4.1-mini as default model with temperature 0.8 for creative yet consistent wellness content"
  - "Module-level OpenAI singleton matching moderation.ts pattern for consistent SDK usage"
  - "Stream errors yield getRandomFallback() instead of throwing, maintaining session continuity"
  - "filterSafety has no try/catch -- checkContentSafety handles its own errors per its contract"

patterns-established:
  - "Three-stage async generator pipeline: token stream -> sentence chunker -> safety filter"
  - "yield* delegation for composing async generators without intermediate buffering"
  - "Error boundary at LLM stream layer only; downstream stages trust upstream contracts"

requirements-completed: [VOIC-01, VOIC-06]

# Metrics
duration: 3min
completed: 2026-02-21
---

# Phase 3 Plan 2: LLM Streaming Pipeline Summary

**Three-stage async generator pipeline composing OpenAI Responses API streaming with sentence chunking and per-sentence safety filtering**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-21T08:57:43Z
- **Completed:** 2026-02-21T09:00:17Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments
- Built three-stage streaming pipeline: streamLlmTokens -> chunkBySentence -> filterSafety
- OpenAI Responses API integration with `stream: true` for real-time token deltas
- Session prompt template combining SAFETY_SYSTEM_PROMPT + wellness persona + optional context
- Stream error handling yields wellness fallback instead of crashing the generator
- Every sentence passes through three-layer content safety before reaching consumers
- Full barrel exports via index.ts for convenient @/lib/llm imports

## Task Commits

Each task was committed atomically:

1. **Task 1: Create session prompt templates and streaming pipeline** - `6091665` (feat)

## Files Created/Modified
- `src/lib/llm/prompts.ts` - SESSION_PROMPT persona template and buildSessionInstructions combining safety + persona + context
- `src/lib/llm/generate-session.ts` - Four async generators: streamLlmTokens, chunkBySentence, filterSafety, generateSession
- `src/lib/llm/index.ts` - Barrel re-exports for full LLM module public API

## Decisions Made
- Used gpt-4.1-mini as default model with temperature 0.8 -- balances creative generation with consistent wellness tone
- Module-level OpenAI singleton (same pattern as moderation.ts) -- reads OPENAI_API_KEY from process.env
- Stream errors caught at streamLlmTokens layer only; yields getRandomFallback() to maintain session continuity without crashing
- filterSafety omits try/catch because checkContentSafety handles its own errors internally (documented contract in safety/index.ts)
- MAX_OUTPUT_TOKENS capped at 4096 to prevent runaway generation costs

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - OPENAI_API_KEY was already configured in Phase 2 for the Moderation API.

## Next Phase Readiness
- `generateSession` is ready for consumption by Phase 4 (TTS pipeline) -- yields safe, complete sentences
- The async generator pattern allows Phase 4 to consume sentences one at a time for streaming TTS
- All exports available via `@/lib/llm` barrel import
- Phase 3 is now complete (2/2 plans done)

## Self-Check: PASSED

All files verified present. All commits verified in git log.

---
*Phase: 03-llm-text-generation-pipeline*
*Completed: 2026-02-21*
