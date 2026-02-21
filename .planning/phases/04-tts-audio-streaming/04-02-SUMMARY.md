---
phase: 04-tts-audio-streaming
plan: 02
subsystem: infra
tags: [websocket, next-ws, ws, real-time, streaming, session-handler]

# Dependency graph
requires:
  - phase: 03-llm-text-generation-pipeline
    provides: generateSession async generator for text streaming
  - phase: 04-tts-audio-streaming/01
    provides: streamSessionAudio pipeline function from @/lib/tts
provides:
  - WebSocket SOCKET handler at /api/session/ws via next-ws
  - Typed message protocol (ServerMessage, ClientMessage discriminated unions)
  - Session lifecycle handler with start/pause/resume/end commands
  - Ping/pong heartbeat for connection keepalive
  - Binary audio frame forwarding from TTS pipeline to client
affects: [04-tts-audio-streaming/03, 05-session-state-machine, 06-client-ui, 07-session-ux]

# Tech tracking
tech-stack:
  added: [next-ws@2.1.16, ws@8.19.0, "@types/ws@8.18.1"]
  patterns: [next-ws SOCKET export, discriminated union message protocol, dynamic import for lazy TTS loading, Promise-based pause gate]

key-files:
  created:
    - src/lib/ws/message-types.ts
    - src/lib/ws/session-handler.ts
    - src/lib/ws/index.ts
    - src/app/api/session/ws/route.ts
  modified:
    - package.json

key-decisions:
  - "Dynamic import for @/lib/tts to decouple WebSocket handler from TTS module build order"
  - "Promise-based pause gate pattern: pause sets flag, resume resolves pending Promise"
  - "Binary audio frames sent via raw ws.send(Uint8Array) without JSON wrapping for efficiency"
  - "Ping/pong heartbeat at 30-second intervals for mobile connection keepalive"

patterns-established:
  - "next-ws SOCKET export: export function SOCKET(client, request) in App Router route files"
  - "Discriminated union message protocol with parseClientMessage/serializeServerMessage utilities"
  - "AbortController per-connection for clean pipeline cancellation on disconnect or end"
  - "Dynamic import pattern for cross-module lazy loading to avoid circular dependencies"

requirements-completed: [INFR-06]

# Metrics
duration: 3min
completed: 2026-02-21
---

# Phase 4 Plan 2: WebSocket Gateway Summary

**next-ws WebSocket gateway at /api/session/ws with typed message protocol, session lifecycle handler, and binary audio frame forwarding**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-21T09:19:16Z
- **Completed:** 2026-02-21T09:22:33Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- WebSocket gateway accepting connections at /api/session/ws via next-ws patch
- Type-safe message protocol using discriminated unions (ServerMessage/ClientMessage) with safe parsing
- Session handler managing full lifecycle: start triggers TTS pipeline, pause/resume control flow, end aborts cleanly
- Ping/pong heartbeat and AbortController cancellation for robust connection management

## Task Commits

Each task was committed atomically:

1. **Task 1: Install next-ws and create WebSocket message protocol** - `abc54f1` (feat)
2. **Task 2: Create WebSocket route handler and session handler** - `1ce06d9` (feat)

## Files Created/Modified
- `src/lib/ws/message-types.ts` - ServerMessage/ClientMessage discriminated unions, parseClientMessage, serializeServerMessage
- `src/lib/ws/session-handler.ts` - Session lifecycle manager: start/pause/resume/end, heartbeat, AbortController
- `src/lib/ws/index.ts` - Barrel exports for ws module
- `src/app/api/session/ws/route.ts` - next-ws SOCKET handler and 426 GET fallback
- `package.json` - Added next-ws, ws, @types/ws dependencies and prepare script

## Decisions Made
- **Dynamic import for TTS module:** Used `await import("@/lib/tts")` with `unknown` intermediate cast to decouple WebSocket handler from TTS module build order. This allows 04-02 to compile independently of 04-01 completion.
- **Promise-based pause gate:** Pause/resume uses a stored resolve callback pattern -- when paused, the pipeline loop awaits a Promise whose resolve function is called on resume. Simple and efficient with no polling.
- **Binary audio frames without JSON wrapping:** Audio data is sent as raw Uint8Array via `client.send(data)` using WebSocket binary opcode, avoiding JSON serialization overhead for audio bytes.
- **30-second ping/pong interval:** Matches research recommendation for mobile connection keepalive without excessive overhead.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed TypeScript compilation error for dynamic TTS import**
- **Found during:** Task 2 (session handler)
- **Issue:** TypeScript rejected `as { streamSessionAudio: ... }` type assertion on dynamic import because the existing `@/lib/tts` index.ts doesn't yet export `streamSessionAudio` (04-01 audio-pipeline.ts not yet committed)
- **Fix:** Changed to `as unknown as { streamSessionAudio: ... }` intermediate cast, which is the standard TypeScript pattern for dynamic imports of partially-built modules
- **Files modified:** src/lib/ws/session-handler.ts
- **Verification:** `npx tsc --noEmit` passes clean
- **Committed in:** 1ce06d9 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix necessary because 04-01 TTS pipeline is partially built. No scope creep. Cast will become unnecessary once 04-01 completes and exports streamSessionAudio.

## Issues Encountered
- TTS module (04-01) has partially committed files on disk (elevenlabs-client.ts, tts-service.ts, index.ts exist) but audio-pipeline.ts with streamSessionAudio is not yet created. The dynamic import pattern handles this gracefully at compile time; runtime will work once 04-01 is complete.

## User Setup Required

None - no external service configuration required for this plan.

## Next Phase Readiness
- WebSocket gateway is ready for client-side integration (04-03: AudioPlaybackQueue and WebSocket hooks)
- Session handler will connect to TTS pipeline once 04-01 audio-pipeline.ts is complete
- Authentication check at WebSocket connection is deferred to Phase 5/6 (TODO in route.ts)

## Self-Check: PASSED

All files verified present on disk. All commit hashes found in git log.

---
*Phase: 04-tts-audio-streaming*
*Completed: 2026-02-21*
