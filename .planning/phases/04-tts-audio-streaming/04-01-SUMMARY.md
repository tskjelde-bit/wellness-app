---
phase: 04-tts-audio-streaming
plan: 01
subsystem: tts
tags: [elevenlabs, tts, audio-streaming, async-generator, pipeline]

# Dependency graph
requires:
  - phase: 03-llm-text-generation-pipeline
    provides: "generateSession async generator yielding safe, complete sentences"
provides:
  - "ElevenLabs SDK singleton and TTS configuration constants"
  - "synthesizeSentence async generator (sentence -> audio chunks)"
  - "streamSessionAudio cascading pipeline (LLM -> TTS -> AudioChunkEvents)"
  - "ELEVENLABS_API_KEY env validation"
affects: [04-tts-audio-streaming, 05-session-state, 06-ui-frontend]

# Tech tracking
tech-stack:
  added: ["@elevenlabs/elevenlabs-js v2.36.0"]
  patterns: ["Module-level SDK singleton", "Async generator pipeline composition", "ReadableStream reader pattern for TypeScript ES2017 target"]

key-files:
  created:
    - src/lib/tts/elevenlabs-client.ts
    - src/lib/tts/tts-service.ts
    - src/lib/tts/audio-pipeline.ts
    - src/lib/tts/index.ts
  modified:
    - src/lib/env.ts

key-decisions:
  - "ReadableStream getReader() pattern instead of for-await-of (ES2017 TypeScript target lacks Symbol.asyncIterator on ReadableStream)"
  - "George voice (JBFqnCBsd6RMkjVDRZzb) as placeholder; warm male narration until final voice selection"
  - "eleven_flash_v2_5 model for ~75ms TTFB streaming with 0.95x speed for wellness pacing"
  - "AbortSignal passed via SDK requestOptions (3rd param), not request body"

patterns-established:
  - "ElevenLabs singleton pattern: module-level ElevenLabsClient matching OpenAI singleton in generate-session.ts"
  - "TTS_CONFIG const object for centralized voice/model/format configuration"
  - "AudioChunkEvent discriminated union for typed pipeline events (sentence_start, audio, sentence_end, session_end)"
  - "Graceful error handling in synthesizeSentence: log and return, no throw (matches LLM fallback pattern)"

requirements-completed: [VOIC-03, VOIC-04]

# Metrics
duration: 4min
completed: 2026-02-21
---

# Phase 04 Plan 01: TTS & Audio Streaming Summary

**ElevenLabs TTS service and cascading audio pipeline connecting Phase 3 sentence stream to audio chunk generation via eleven_flash_v2_5 with prosody context**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-21T09:18:57Z
- **Completed:** 2026-02-21T09:23:03Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- ElevenLabs SDK installed and configured with module-level singleton pattern
- TTS service converts text sentences into async audio chunk streams with abort support and prosody context
- Cascading audio pipeline connects generateSession (Phase 3) to TTS, yielding typed AudioChunkEvents
- Previous text accumulator (last 1000 chars) passes to ElevenLabs for prosody continuity across sentences

## Task Commits

Each task was committed atomically:

1. **Task 1: Install ElevenLabs SDK and create TTS service** - `f233095` (feat)
2. **Task 2: Create cascading audio pipeline** - `e9470a3` (feat)

## Files Created/Modified
- `src/lib/tts/elevenlabs-client.ts` - ElevenLabs SDK singleton and TTS_CONFIG constants (voice, model, format, latency, voice settings)
- `src/lib/tts/tts-service.ts` - synthesizeSentence async generator: sentence text -> Uint8Array audio chunks via ElevenLabs streaming API
- `src/lib/tts/audio-pipeline.ts` - streamSessionAudio: connects generateSession -> synthesizeSentence, yields AudioChunkEvents with sentence metadata
- `src/lib/tts/index.ts` - Barrel exports for TTS module (synthesizeSentence, streamSessionAudio, AudioChunkEvent, elevenlabs, TTS_CONFIG)
- `src/lib/env.ts` - Added ELEVENLABS_API_KEY to Zod validation schema

## Decisions Made
- Used `ReadableStream.getReader()` pattern instead of `for await...of` because the ES2017 TypeScript target's `dom` lib does not include `Symbol.asyncIterator` on `ReadableStream`
- Selected George voice (JBFqnCBsd6RMkjVDRZzb) as placeholder warm male narration voice; configurable via TTS_CONFIG
- AbortSignal is passed via SDK `requestOptions` (3rd parameter), not in the request body, matching the SDK's `BaseRequestOptions` interface
- Voice settings tuned for wellness delivery: stability 0.7, similarityBoost 0.75, style 0.3, speed 0.95

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed ReadableStream async iteration incompatibility**
- **Found during:** Task 1 (TTS service implementation)
- **Issue:** `for await (const chunk of audioStream)` fails with TS2504 because `ReadableStream<Uint8Array>` lacks `Symbol.asyncIterator` in the ES2017 dom lib
- **Fix:** Replaced with `getReader()` pattern: `while (true) { const { done, value } = await reader.read(); if (done) break; yield value; }` with proper `reader.releaseLock()` in finally block
- **Files modified:** `src/lib/tts/tts-service.ts`
- **Verification:** `npx tsc --noEmit` passes with no errors
- **Committed in:** f233095 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Auto-fix necessary for TypeScript compatibility. No scope creep.

## Issues Encountered
None beyond the ReadableStream type issue auto-fixed above.

## User Setup Required

This plan requires the following environment variable:

- **ELEVENLABS_API_KEY** - ElevenLabs API key for TTS synthesis
  - Source: [ElevenLabs Dashboard -> Profile + API Key](https://elevenlabs.io/app/settings/api-keys)
  - Add to `.env.local`: `ELEVENLABS_API_KEY=your_key_here`

## Next Phase Readiness
- TTS service and audio pipeline are ready for WebSocket integration (04-02)
- streamSessionAudio yields AudioChunkEvents that the WebSocket handler will consume
- AbortController propagation enables clean session cancellation from WebSocket close/end events

## Self-Check: PASSED

All 5 files verified present. Both commit hashes (f233095, e9470a3) verified in git log.

---
*Phase: 04-tts-audio-streaming*
*Completed: 2026-02-21*
