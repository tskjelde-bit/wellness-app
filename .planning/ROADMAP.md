# Roadmap: Wellness & Sensory Connection Assistant

## Overview

This roadmap delivers a voice-guided wellness AI from foundation to launch. The structure follows the product's dependency chain: data layer and auth first, then safety (because every user interaction needs it), then the streaming pipeline (LLM to TTS to audio), then session intelligence that orchestrates the pipeline, then the client that consumes it all, and finally differentiators that elevate the experience. Payment processing is isolated as its own phase due to high-risk vendor complexity. Nine phases, each delivering a coherent, testable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Project Scaffolding & Data Layer** - Next.js project, PostgreSQL schema, Redis session store, user auth
- [x] **Phase 2: Safety & Consent Framework** - Age verification, AI disclosure, consent gates, content safety guardrails, crisis detection, privacy enforcement
- [x] **Phase 3: LLM Text Generation Pipeline** - Streaming LLM output, sentence-boundary chunking, per-sentence safety filtering
- [ ] **Phase 4: TTS & Audio Streaming** - ElevenLabs TTS integration, WebSocket gateway, cascading pipeline delivering audio to client
- [ ] **Phase 5: Session State Machine & Orchestration** - 5-phase session flow, phase transitions, session orchestrator coordinating pipeline and state
- [ ] **Phase 6: Client UI & Theme** - Pink wellness theme, responsive layout, voice-first session screen, session start flow
- [ ] **Phase 7: Session UX & Controls** - Playback controls, phase progress indicator, conversational consent UX, session length selection
- [ ] **Phase 8: Payment Integration** - High-risk payment processor integration for adult wellness content
- [ ] **Phase 9: Differentiators & Polish** - Mood-based sessions, ambient soundscapes, volume mixer, voice options, post-session aftercare

## Phase Details

### Phase 1: Project Scaffolding & Data Layer
**Goal**: Users can create accounts and log in, with persistent sessions backed by PostgreSQL and Redis
**Depends on**: Nothing (first phase)
**Requirements**: INFR-01, INFR-02, INFR-04, INFR-05
**Success Criteria** (what must be TRUE):
  1. User can create an account with email and password and log in
  2. User session persists across browser refresh without re-authentication
  3. PostgreSQL database stores user accounts and session metadata
  4. Redis session store holds ephemeral session state with TTL-based auto-expiry
  5. Next.js project runs locally and deploys to Vercel
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Scaffold Next.js 16 project, Drizzle schema, Redis client, env validation
- [x] 01-02-PLAN.md — Auth.js v5 authentication, login/register pages, route protection

### Phase 2: Safety & Consent Framework
**Goal**: Users encounter age verification, AI disclosure, consent gates, and content safety at every interaction boundary before any session content is accessible
**Depends on**: Phase 1
**Requirements**: SAFE-01, SAFE-02, SAFE-03, SAFE-04, SAFE-05, SAFE-06, SAFE-07, SAFE-08
**Success Criteria** (what must be TRUE):
  1. User must confirm they are 18+ before accessing any session content
  2. User sees clear AI disclosure ("This is an AI guide") at session start
  3. User must provide explicit consent before body awareness / sensory content phases
  4. System blocks unsafe content through layered filtering (system prompt + output classifier + keyword blocklist)
  5. AI gracefully redirects boundary-pushing requests without breaking session immersion
  6. System detects crisis language and provides helpline resources
  7. No session transcripts or recordings are stored anywhere in the system
  8. Privacy policy and terms of service are presented before first session
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Schema extensions, consent server actions, consent checks, proxy enforcement
- [x] 02-02-PLAN.md — Three-layer content safety pipeline (moderation API + keyword blocklist + crisis detector)
- [x] 02-03-PLAN.md — Consent UI pages (age gate, ToS acceptance, legal pages, AI disclosure, sensory consent, crisis banner)

### Phase 3: LLM Text Generation Pipeline
**Goal**: The system generates wellness session text in real-time via streaming LLM, chunked at natural sentence boundaries and safety-filtered before downstream consumption
**Depends on**: Phase 2
**Requirements**: VOIC-01, VOIC-02, VOIC-06
**Success Criteria** (what must be TRUE):
  1. LLM generates session content in real-time via OpenAI Responses API streaming
  2. Generated text is chunked at sentence boundaries (min ~40 chars) for natural prosody
  3. Every sentence passes through safety filter between LLM output and downstream processing
  4. Unsafe sentences are replaced with pre-written fallbacks without breaking session flow
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md — TDD: Sentence boundary chunker with abbreviation handling and min-length threshold
- [x] 03-02-PLAN.md — Streaming LLM pipeline (OpenAI Responses API -> sentence chunker -> safety filter)

### Phase 4: TTS & Audio Streaming
**Goal**: Users hear the AI guide's voice within 2 seconds of session start, delivered as gap-free streaming audio through the cascading pipeline
**Depends on**: Phase 3
**Requirements**: VOIC-03, VOIC-04, VOIC-05, INFR-06
**Success Criteria** (what must be TRUE):
  1. ElevenLabs TTS converts text chunks to audio with warm, natural voice quality
  2. First audio reaches the user within 2 seconds of session start (cascading pipeline)
  3. Audio streams to client via WebSocket with double-buffer playback queue for gap-free listening
  4. WebSocket gateway handles real-time bidirectional communication between client and server
  5. End-to-end pipeline works: LLM streams text, chunker splits sentences, safety filters, TTS speaks, client plays
**Plans**: 3 plans

Plans:
- [ ] 04-01-PLAN.md — ElevenLabs TTS service and cascading audio pipeline (server-side)
- [ ] 04-02-PLAN.md — WebSocket gateway with next-ws, message protocol, and session handler
- [ ] 04-03-PLAN.md — Client-side AudioPlaybackQueue and WebSocket integration hooks

### Phase 5: Session State Machine & Orchestration
**Goal**: Sessions follow the complete 5-phase structured flow (Atmosphere, Breathing, Sensory, Relaxation, Resolution) with natural transitions and phase-specific guidance
**Depends on**: Phase 4
**Requirements**: SESS-01, SESS-02, SESS-04, SESS-05, SESS-06
**Success Criteria** (what must be TRUE):
  1. Session follows the 5-phase structured flow from Atmosphere through Resolution
  2. Each phase has distinct tone, pacing, and system prompt guidance that users can perceive
  3. Phase transitions occur naturally based on timing and content completion (not abrupt cuts)
  4. Resolution phase provides grounding and gentle return to awareness
  5. Session state machine manages phase progression server-side via Redis
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Client UI & Theme
**Goal**: Users see a polished pink wellness-themed interface optimized for mobile, with a voice-first session screen and the ability to start a new session
**Depends on**: Phase 4
**Requirements**: UI-01, UI-02, UI-05, SESS-07
**Success Criteria** (what must be TRUE):
  1. Pink wellness theme is applied consistently (blush #F8C8DC, rose #D63384, charcoal #2B2B2B)
  2. Layout is responsive and optimized for mobile browsers
  3. Active sessions show minimal visual chrome -- voice-first, screen-secondary
  4. User can start a new session from the main screen
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

### Phase 7: Session UX & Controls
**Goal**: Users have full control over their session experience with playback controls, phase progress visibility, conversational consent flow, and session length selection
**Depends on**: Phase 5, Phase 6
**Requirements**: UI-03, UI-04, UI-06, UI-07, SESS-03
**Success Criteria** (what must be TRUE):
  1. User can pause, resume, and end a session at any time
  2. User can see which phase of the session they are currently in
  3. Consent flow is woven conversationally into session start (not a clinical modal)
  4. User can select session length (10 / 15 / 20 / 30 minutes) before starting
  5. Selected session length affects actual session duration and phase pacing
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD

### Phase 8: Payment Integration
**Goal**: Users can pay for the service through a payment processor that accepts adult wellness content
**Depends on**: Phase 1
**Requirements**: INFR-03
**Success Criteria** (what must be TRUE):
  1. High-risk-compatible payment processor is integrated (not Stripe or PayPal)
  2. User can complete a payment transaction for service access
  3. Payment flow handles success, failure, and edge cases gracefully
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

### Phase 9: Differentiators & Polish
**Goal**: Sessions feel elevated and personalized through mood adaptation, ambient soundscapes, voice selection, and post-session aftercare
**Depends on**: Phase 5, Phase 7
**Requirements**: DIFF-01, DIFF-02, DIFF-03, DIFF-04, DIFF-05
**Success Criteria** (what must be TRUE):
  1. User can indicate their emotional state before a session, and the AI adapts session emphasis accordingly
  2. Background ambient soundscapes (rain, ocean, forest, ambient, silence) play under the AI voice during sessions
  3. User can adjust voice and ambient volume independently with a mixer control
  4. User can choose from 2-3 curated AI voice options with distinct warmth/tone profiles
  5. After a session ends, user receives reflection prompts and grounding exercises
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9
Note: Phase 6 depends on Phase 4 (not Phase 5), so Phases 5 and 6 can run in parallel. Phase 8 depends only on Phase 1, so it can run in parallel with Phases 2-7.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Scaffolding & Data Layer | 2/2 | Complete | 2026-02-21 |
| 2. Safety & Consent Framework | 3/3 | Complete | 2026-02-21 |
| 3. LLM Text Generation Pipeline | 0/2 | Not started | - |
| 4. TTS & Audio Streaming | 2/3 | In Progress|  |
| 5. Session State Machine & Orchestration | 0/TBD | Not started | - |
| 6. Client UI & Theme | 0/TBD | Not started | - |
| 7. Session UX & Controls | 0/TBD | Not started | - |
| 8. Payment Integration | 0/TBD | Not started | - |
| 9. Differentiators & Polish | 0/TBD | Not started | - |
