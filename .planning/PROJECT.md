# Wellness & Sensory Connection Assistant

## What This Is

A voice-guided wellness API powered by an LLM that delivers structured relaxation, body awareness, and emotional intimacy sessions for consenting adults. The AI speaks and guides through conversational phases while the user mostly listens — delivered via phone/web with a pink wellness-themed frontend.

## Core Value

Users experience calm, guided relaxation through intimate, voice-driven AI sessions that feel safe and present.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Structured 5-phase session flow (Atmosphere → Breathing → Sensory → Relaxation → Resolution)
- [ ] LLM-powered real-time response generation with wellness system prompt
- [ ] Voice output via TTS integration with natural pacing
- [ ] Safety constraints enforcement (consent gates, adult-only verification, no explicit content)
- [ ] Phone/web-optimized delivery (streaming audio, low latency)
- [ ] Pink wellness-themed web frontend (blush #F8C8DC, rose #D63384, charcoal #2B2B2B)
- [ ] Session state management (phase progression, user preferences)
- [ ] API endpoints (start session, stream audio, end session)

### Out of Scope

- User-to-user social features — not a community product, it's a 1:1 AI experience
- Explicit or graphic sexual content — wellness and sensory awareness only, hard safety boundary
- Multi-language support — English-first for v1
- Native mobile apps — web-first, mobile-optimized responsive design

## Context

The product is driven by a detailed system prompt that defines the AI's personality, tone, safety constraints, and phase structure. The AI acts as a calm, present wellness guide — warm but boundaried. Sessions progress through structured phases that build from atmosphere-setting to deep relaxation and resolution.

The system prompt enforces consent-first design: the AI checks in, respects boundaries, and never pushes past user comfort. Content stays in the wellness/sensory awareness domain — intimate but never explicit.

The frontend uses a distinctive pink wellness palette:
- Blush: #F8C8DC (backgrounds, soft surfaces)
- Rose: #D63384 (accents, CTAs, active states)
- Charcoal: #2B2B2B (text, contrast elements)

Voice delivery is central — the user experience is primarily auditory. Text is secondary, used for controls and session metadata.

## Constraints

- **Content Policy**: Adults-only, consent-first — no explicit/graphic content under any circumstances
- **Delivery**: Voice-first experience — TTS quality and latency are critical to the experience
- **Session Coherence**: AI must maintain context across session phases without losing thread
- **Privacy**: No session recordings stored by default — user data minimization

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Voice-first, text-secondary UX | The product value is in guided listening, not reading | — Pending |
| 5-phase session structure | Provides narrative arc from warm-up to resolution | — Pending |
| Consent gates before intimate content | Safety-first design, legal and ethical requirement | — Pending |
| Pink wellness theme | Distinctive brand identity, signals warmth and care | — Pending |

---
*Last updated: 2026-02-21 after initialization*
