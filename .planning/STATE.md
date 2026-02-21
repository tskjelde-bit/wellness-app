# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-21)

**Core value:** Users experience calm, guided relaxation through intimate, voice-driven AI sessions that feel safe and present
**Current focus:** Phase 9 in progress - Differentiators & Polish (2/3 plans done)

## Current Position

Phase: 9 of 9
Plan: 2 of 3 in current phase
Status: In Progress
Last activity: 2026-02-21 -- Completed 09-02-PLAN.md (Audio mixing & ambient soundscapes)

Progress: [##########] 97%

## Performance Metrics

**Velocity:**
- Total plans completed: 21
- Average duration: 3 min
- Total execution time: 0.80 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 2 | 7 min | 3.5 min |
| 2 | 3 | 9 min | 3 min |
| 3 | 2 | 6 min | 3 min |
| 4 | 3 | 8 min | 2.7 min |
| 5 | 3 | 6 min | 2 min |
| 6 | 2 | 2 min | 1 min |
| 7 | 2 | 2 min | 1 min |
| 8 | 2 | 4 min | 2 min |

| 9 | 2+ | 4+ min | 2 min |

**Recent Trend:**
- Last 5 plans: 07-02 (1 min), 08-01 (2 min), 08-02 (2 min), 09-01 (2 min), 09-02 (2 min)
- Trend: Stable

*Updated after each plan completion*
| Phase 04 P03 | 2min | 2 tasks | 2 files |
| Phase 04 P02 | 3min | 2 tasks | 5 files |
| Phase 04 P01 | 4min | 2 tasks | 5 files |
| Phase 05 P01 | 3min | 2 tasks | 4 files |
| Phase 05 P02 | 2min | 2 tasks | 4 files |
| Phase 05 P03 | 1min | 2 tasks | 2 files |
| Phase 06 P01 | 1min | 2 tasks | 3 files |
| Phase 06 P02 | 1min | 2 tasks | 4 files |
| Phase 07 P01 | 1min | 2 tasks | 4 files |
| Phase 07 P02 | 1min | 2 tasks | 3 files |
| Phase 08 P01 | 2min | 2 tasks | 7 files |
| Phase 08 P02 | 2min | 3 tasks | 6 files |
| Phase 09 P02 | 2min | 2 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 9-phase structure derived from 39 requirements across 6 categories
- [Roadmap]: Safety & consent framework placed before any pipeline work (Phase 2)
- [Roadmap]: Payment integration isolated as Phase 8 due to high-risk vendor complexity
- [Roadmap]: Phase 6 (UI) depends on Phase 4 (not 5), enabling parallel work with Phase 5
- [01-01]: Used process.env directly in db/index.ts to avoid circular dependency with Auth.js
- [01-01]: Drizzle migrations prefer DATABASE_URL_UNPOOLED for Neon PgBouncer compatibility
- [01-01]: Env validation uses safeParse with formatted error output for better DX
- [01-02]: Placeholder DATABASE_URL fallback in db/index.ts for build-time safety when credentials not yet configured
- [01-02]: Dashboard uses force-dynamic to prevent pre-rendering attempts that require database access
- [01-02]: Server action signatures use (_prevState, formData) for useActionState compatibility
- [02-01]: DOB processed for age calculation only, never stored -- ageVerifiedAt timestamp persisted (GDPR data minimization)
- [02-01]: consent-complete cookie set only when all three required consents given, enables optimistic proxy check
- [02-01]: Sensory consent is per-session (audit log only), not permanent (no user column)
- [02-01]: Batch insert for ToS + privacy consent records in single db.insert() call
- [02-02]: HELPLINE_RESOURCES duplicated in safety/constants.ts as fallback; TODO to unify with consent/constants.ts
- [02-02]: Sexual category moderation threshold set at 0.8 to avoid false positives on body-awareness wellness language
- [02-02]: OpenAI SDK Categories/CategoryScores require 'as unknown as Record' type assertion (SDK typing limitation)
- [02-03]: Legal pages use (legal) route group, accessible without authentication
- [02-03]: Consent flow uses server-side redirect chain: dashboard -> verify-age -> accept-terms -> dashboard
- [02-03]: SensoryConsent uses callback props (onConsent/onSkip) for flexible session integration
- [03-01]: Two-pass boundary algorithm: find all valid boundaries excluding abbreviations, then emit batches once accumulated text exceeds minLength
- [03-01]: Vitest installed as test framework with path alias support matching Next.js tsconfig
- [03-02]: gpt-4.1-mini as default model with temperature 0.8 for creative yet consistent wellness content
- [03-02]: Module-level OpenAI singleton matching moderation.ts pattern for consistent SDK usage
- [03-02]: Stream errors yield getRandomFallback() instead of throwing, maintaining session continuity
- [03-02]: filterSafety omits try/catch -- checkContentSafety handles its own errors per documented contract
- [04-02]: Dynamic import for @/lib/tts to decouple WebSocket handler from TTS module build order
- [04-02]: Promise-based pause gate: pause sets flag, resume resolves pending Promise
- [04-02]: Binary audio frames sent via raw ws.send(Uint8Array) without JSON wrapping for efficiency
- [04-02]: Ping/pong heartbeat at 30-second intervals for mobile connection keepalive
- [Phase 04-01]: ReadableStream getReader() pattern instead of for-await-of (ES2017 target lacks Symbol.asyncIterator)
- [Phase 04-01]: George voice (JBFqnCBsd6RMkjVDRZzb) as placeholder; eleven_flash_v2_5 model with 0.95x speed for wellness pacing
- [Phase 04-01]: AbortSignal passed via SDK requestOptions (3rd param) matching BaseRequestOptions interface
- [Phase 04-01]: Graceful TTS error handling: log and return (no throw) matching LLM fallback pattern
- [04-03]: AudioContext created in user gesture handler (initQueue in connect), not on page load, for browser autoplay policy
- [04-03]: ArrayBuffer.slice(0) before decodeAudioData to prevent detached buffer issues
- [04-03]: Gap-free scheduling via AudioBufferSourceNode.start(nextPlayTime) for audio continuity
- [04-03]: Pause/resume via AudioContext.suspend()/resume() rather than tracking individual source nodes
- [05-01]: Hand-rolled FSM with typed transitions table (~60 lines) instead of XState library
- [05-01]: Phase proportions 0.12/0.20/0.28/0.25/0.15 for atmosphere/breathing/sensory/relaxation/resolution
- [05-01]: SENTENCES_PER_MINUTE = 13 (~4.5s per sentence at natural wellness pacing)
- [05-01]: Wind-down threshold at ~85% of phase budget (minimum 3 sentences before end)
- [05-01]: Transition hints avoid end/finish/final to prevent premature session-ending language
- [05-02]: Single LLM call per phase main content, optional second call with transition hint for wind-down
- [05-02]: store: true on every streamLlmTokens call to enable previous_response_id chaining (Research Pitfall 6)
- [05-02]: Orchestrator yields text events, not audio -- WebSocket handler feeds text into TTS pipeline
- [05-02]: Sentence counting is primary transition signal; no wall-clock timer in v1
- [05-02]: Persist state via merge-read pattern: read existing SessionState, merge orchestrator fields, write back
- [05-03]: Orchestrator yields text, handler drives TTS -- synthesizeSentence called per sentence in ws handler
- [05-03]: previousText prosody context continues across phases (not reset) for voice continuity
- [05-03]: Session length hardcoded to 15 minutes; Phase 7 adds client-selected length
- [05-03]: Dynamic imports for @/lib/session and @/lib/tts/tts-service to avoid circular dependencies
- [06-01]: Kept Geist fonts per research recommendation to defer font changes
- [06-01]: Used min-h-dvh instead of min-h-screen for mobile viewport stability
- [06-01]: Applied themeColor as array with light/dark media queries for adaptive status bar
- [06-02]: connect() in click handler for AudioContext user gesture compliance (browser autoplay policy)
- [06-02]: useEffect-based startSession after isConnected to avoid WebSocket race condition
- [06-02]: End Session button intentionally tiny/subtle for voice-first minimal chrome
- [06-02]: currentPhase tracking added proactively for Phase 7 progress indicator
- [07-01]: Options object pattern for startSession hook (extensible for future params)
- [07-01]: Conversational consent tone: warm first-person AI guide language instead of clinical checkbox
- [07-01]: BreathingOrb as static ambient decoration in consent step (isPlaying=false, opacity-20)
- [07-02]: SVG icons for pause/resume instead of Unicode characters for consistent cross-platform rendering
- [07-02]: PhaseIndicator uses role=progressbar with aria-valuenow/max for screen reader accessibility
- [07-02]: Removed standalone Back to Dashboard link from SessionScreen; PreSessionFlow handles its own navigation
- [Phase 08]: CCBill env vars are optional in envSchema to avoid blocking non-payment development
- [Phase 08]: getCcbillConfig reads process.env directly (not env.ts) to match db/index.ts pattern and avoid circular deps
- [Phase 08]: Webhook signature verification is structural-only for v1; full HMAC deferred to merchant onboarding
- [Phase 08]: Success/failure return URLs derived from request origin at runtime instead of env vars
- [08-02]: subscription-active cookie httpOnly:false with 24h maxAge for proxy.ts middleware readability
- [08-02]: Success page polls checkSubscriptionStatus every 2s for up to 16s to handle webhook race condition
- [08-02]: Only /session/* routes gated behind subscription; /dashboard always accessible
- [09-02]: voiceGain default 1.0, ambientGain default 0.3 -- ambient starts quieter as background layer
- [09-02]: GainNodes created alongside AudioContext in initQueue to maintain autoplay compliance
- [09-02]: 50ms linear ramp for volume changes prevents audible click artifacts on slider interaction
- [09-02]: Single AudioContext shared between voice and ambient channels to avoid browser AudioContext limit

### Pending Todos

None yet.

### Blockers/Concerns

- [Research]: Phase 1 -- Auth.js v5 is beta.30; monitor for breaking changes
- [Research]: Phase 2 -- Age verification scope depends on jurisdiction (DOB vs ID verification)
- [Research]: Phase 4 -- ElevenLabs voice selection must be finalized before build
- [Research]: Phase 8 -- High-risk payment processor vendor selection needs direct research
- [Research]: Vercel AUP for intimate wellness content not explicitly confirmed

## Session Continuity

Last session: 2026-02-21
Stopped at: Completed 09-02-PLAN.md (Audio mixing & ambient soundscapes)
Resume file: None
