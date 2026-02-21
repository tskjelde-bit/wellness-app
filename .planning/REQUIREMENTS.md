# Requirements: Wellness & Sensory Connection Assistant

**Defined:** 2026-02-21
**Core Value:** Users experience calm, guided relaxation through intimate, voice-driven AI sessions that feel safe and present

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Safety & Compliance

- [ ] **SAFE-01**: User must confirm age (18+) before accessing any session content
- [ ] **SAFE-02**: User receives clear AI disclosure at session start ("This is an AI guide")
- [ ] **SAFE-03**: User provides explicit consent before body awareness / sensory content phases
- [ ] **SAFE-04**: System enforces content safety guardrails via layered filtering (system prompt + output classifier + keyword blocklist)
- [ ] **SAFE-05**: AI gracefully redirects boundary-pushing requests without breaking session immersion
- [ ] **SAFE-06**: System detects crisis language (self-harm, distress) and provides helpline resources
- [ ] **SAFE-07**: No session transcripts or recordings stored — ephemeral by design
- [ ] **SAFE-08**: Privacy policy and terms of service presented before first session

### Infrastructure & Auth

- [ ] **INFR-01**: User can create account with email and password
- [ ] **INFR-02**: User session persists across browser refresh
- [ ] **INFR-03**: Payment processor integration uses high-risk-compatible provider (not Stripe/PayPal)
- [ ] **INFR-04**: Redis-backed session state with TTL-based auto-expiry
- [ ] **INFR-05**: PostgreSQL database for user accounts, consent records, and session metadata
- [ ] **INFR-06**: WebSocket gateway for real-time audio streaming to client

### Voice Pipeline

- [ ] **VOIC-01**: LLM generates session content in real-time via streaming API (OpenAI Responses API)
- [ ] **VOIC-02**: Generated text is chunked at sentence boundaries for natural TTS prosody
- [ ] **VOIC-03**: ElevenLabs TTS converts text chunks to audio with warm, natural voice quality
- [ ] **VOIC-04**: Cascading pipeline delivers first audio to user within 2 seconds of session start
- [ ] **VOIC-05**: Audio streams to client via WebSocket with double-buffer playback queue for gap-free listening
- [ ] **VOIC-06**: Safety filter inspects every sentence between LLM output and TTS input

### Session Experience

- [ ] **SESS-01**: Session follows 5-phase structured flow (Atmosphere → Breathing → Sensory → Relaxation → Resolution)
- [ ] **SESS-02**: Each phase has distinct tone, pacing, and system prompt guidance
- [ ] **SESS-03**: User can select session length (10 / 15 / 20 / 30 minutes)
- [ ] **SESS-04**: Phase transitions occur naturally based on timing and content completion
- [ ] **SESS-05**: Resolution phase provides grounding and gentle return to awareness
- [ ] **SESS-06**: Session state machine manages phase progression server-side
- [ ] **SESS-07**: User can start a new session from the main screen

### Client UI

- [ ] **UI-01**: Pink wellness theme applied consistently (blush #F8C8DC, rose #D63384, charcoal #2B2B2B)
- [ ] **UI-02**: Responsive layout optimized for mobile browsers
- [ ] **UI-03**: Basic playback controls (pause, resume, end session)
- [ ] **UI-04**: Phase progress indicator showing current session phase
- [ ] **UI-05**: Minimal visual chrome during active sessions — voice-first, screen-secondary
- [ ] **UI-06**: Consent flow woven conversationally into session start (not clinical modal)
- [ ] **UI-07**: Session length selection before starting

### Differentiators

- [ ] **DIFF-01**: Mood-based session selection — user indicates emotional state, AI adapts session emphasis
- [ ] **DIFF-02**: Background ambient soundscapes layered under voice (rain, ocean, forest, ambient, silence)
- [ ] **DIFF-03**: Voice/ambient volume mixer for user control
- [ ] **DIFF-04**: 2-3 curated AI voice options with distinct warmth/tone profiles
- [ ] **DIFF-05**: Post-session aftercare with reflection prompts and grounding exercises

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Personalization

- **PERS-01**: Adaptive personalization — AI learns preferences across sessions over time
- **PERS-02**: Progressive multi-session series (e.g., 7-day body awareness journey)
- **PERS-03**: User preference profiles persisted (preferred length, voice, pacing, soundscape)

### Advanced Interaction

- **INTX-01**: Voice input during sessions (STT for spoken responses)
- **INTX-02**: Text-based mid-session check-ins for user agency
- **INTX-03**: Conversational interactivity adapting session flow based on user responses

### Platform Expansion

- **PLAT-01**: Native mobile app (iOS/Android)
- **PLAT-02**: Smart speaker / Apple Watch support
- **PLAT-03**: Multi-language TTS support

## Out of Scope

| Feature | Reason |
|---------|--------|
| User voice cloning | Legal consent liability, deepfake concerns |
| Social features / community | Breaks private safe-space nature of product |
| Gamification (streaks, badges) | Creates anxiety; antithetical to wellness purpose |
| Explicit sexual content | Legal, ethical, platform risk — firm brand boundary |
| Therapy / clinical claims | FDA regulatory minefield without clinical validation |
| Biometric / wearable integration | Hardware dependency delays MVP; design data model for future |
| OAuth / social login | Email/password sufficient for v1; reduces third-party dependencies |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SAFE-01 | Phase 2 | Pending |
| SAFE-02 | Phase 2 | Pending |
| SAFE-03 | Phase 2 | Pending |
| SAFE-04 | Phase 2 | Pending |
| SAFE-05 | Phase 2 | Pending |
| SAFE-06 | Phase 2 | Pending |
| SAFE-07 | Phase 2 | Pending |
| SAFE-08 | Phase 2 | Pending |
| INFR-01 | Phase 1 | Pending |
| INFR-02 | Phase 1 | Pending |
| INFR-03 | Phase 8 | Pending |
| INFR-04 | Phase 1 | Pending |
| INFR-05 | Phase 1 | Pending |
| INFR-06 | Phase 4 | Pending |
| VOIC-01 | Phase 3 | Pending |
| VOIC-02 | Phase 3 | Pending |
| VOIC-03 | Phase 4 | Pending |
| VOIC-04 | Phase 4 | Pending |
| VOIC-05 | Phase 4 | Pending |
| VOIC-06 | Phase 3 | Pending |
| SESS-01 | Phase 5 | Pending |
| SESS-02 | Phase 5 | Pending |
| SESS-03 | Phase 7 | Pending |
| SESS-04 | Phase 5 | Pending |
| SESS-05 | Phase 5 | Pending |
| SESS-06 | Phase 5 | Pending |
| SESS-07 | Phase 6 | Pending |
| UI-01 | Phase 6 | Pending |
| UI-02 | Phase 6 | Pending |
| UI-03 | Phase 7 | Pending |
| UI-04 | Phase 7 | Pending |
| UI-05 | Phase 6 | Pending |
| UI-06 | Phase 7 | Pending |
| UI-07 | Phase 7 | Pending |
| DIFF-01 | Phase 9 | Pending |
| DIFF-02 | Phase 9 | Pending |
| DIFF-03 | Phase 9 | Pending |
| DIFF-04 | Phase 9 | Pending |
| DIFF-05 | Phase 9 | Pending |

**Coverage:**
- v1 requirements: 39 total
- Mapped to phases: 39
- Unmapped: 0

---
*Requirements defined: 2026-02-21*
*Last updated: 2026-02-21 after roadmap creation*
