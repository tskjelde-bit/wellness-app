# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-21)

**Core value:** Users experience calm, guided relaxation through intimate, voice-driven AI sessions that feel safe and present
**Current focus:** Phase 3 - LLM Text Generation Pipeline (sentence chunker complete, streaming pipeline next)

## Current Position

Phase: 3 of 9
Plan: 1 of 2 in current phase
Status: In Progress
Last activity: 2026-02-21 -- Completed 03-01-PLAN.md (Sentence boundary chunker)

Progress: [####......] 33%

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: 3.2 min
- Total execution time: 0.32 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 2 | 7 min | 3.5 min |
| 2 | 3 | 9 min | 3 min |
| 3 | 1 | 3 min | 3 min |

**Recent Trend:**
- Last 5 plans: 02-01 (3 min), 02-02 (3 min), 02-03 (3 min), 03-01 (3 min)
- Trend: Stable

*Updated after each plan completion*

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
Stopped at: Completed 03-01-PLAN.md (Sentence boundary chunker) -- Phase 3 plan 1/2
Resume file: None
