---
phase: 02-safety-consent-framework
plan: 01
subsystem: consent
tags: [consent, age-verification, privacy, tos, drizzle, audit-trail, proxy, openai]

# Dependency graph
requires:
  - phase: 01-project-scaffolding-data-layer
    provides: "Drizzle schema (usersTable), db client, Auth.js, proxy.ts, session-store"
provides:
  - "consent_records table for immutable consent audit log"
  - "User consent timestamp columns (ageVerifiedAt, tosAcceptedAt, privacyAcceptedAt)"
  - "Consent server actions: verifyAge, acceptTerms, recordSensoryConsent"
  - "getUserConsentStatus function returning structured ConsentStatus"
  - "AI disclosure text and helpline resources constants"
  - "proxy.ts consent enforcement redirecting unconsented users to /verify-age"
  - "SessionState interface extended with consent flags"
  - "OPENAI_API_KEY in env validation"
affects: [02-02-PLAN, 02-03-PLAN, phase-03, phase-05]

# Tech tracking
tech-stack:
  added: []
  patterns: [consent-audit-trail, consent-cookie-optimistic-check, server-action-consent-recording, data-minimization-dob]

key-files:
  created:
    - src/lib/consent/constants.ts
    - src/lib/consent/checks.ts
    - src/lib/consent/index.ts
    - src/actions/consent.ts
    - drizzle/0001_conscious_klaw.sql
  modified:
    - src/lib/db/schema.ts
    - src/lib/env.ts
    - src/lib/session-store.ts
    - src/proxy.ts

key-decisions:
  - "DOB is used for age calculation only -- not stored, only ageVerifiedAt timestamp persisted (GDPR data minimization)"
  - "consent-complete cookie set only when ALL three required consents are given, enabling optimistic proxy checks"
  - "Sensory consent recorded in audit log only, not as a user column (per-session, not permanent)"
  - "Batch insert for ToS and privacy consent records in a single db.insert() call"

patterns-established:
  - "Consent audit trail: all consent events recorded in consent_records table with type, version, and timestamp"
  - "Optimistic consent check: proxy.ts checks consent-complete cookie before hitting database"
  - "Server action consent pattern: authenticate via auth(), validate input, insert consent record, update user column, check completion and set cookie"
  - "Data minimization: process PII (DOB) for verification then discard, store only boolean/timestamp result"

requirements-completed: [SAFE-01, SAFE-02, SAFE-03, SAFE-07, SAFE-08]

# Metrics
duration: 3min
completed: 2026-02-21
---

# Phase 2 Plan 01: Consent Data Layer & Proxy Enforcement Summary

**Consent audit trail with consent_records table, DOB-based age verification server action, ToS/privacy acceptance, sensory consent recording, and proxy.ts consent enforcement via optimistic cookie check**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-21T08:27:34Z
- **Completed:** 2026-02-21T08:30:47Z
- **Tasks:** 2
- **Files modified:** 5 created, 4 modified

## Accomplishments
- Database schema extended with consent_records table (immutable audit log) and three consent timestamp columns on usersTable
- Three consent server actions created: verifyAge (DOB-based, 18+ validation, no DOB storage), acceptTerms (dual ToS + privacy recording), recordSensoryConsent (per-session audit only)
- getUserConsentStatus function queries user consent columns and returns structured boolean status
- proxy.ts enforces consent completion via consent-complete cookie check, redirecting unconsented authenticated users to /verify-age
- AI disclosure text, helpline resources (988 Lifeline + SAMHSA), consent types, and consent version defined as constants
- SessionState interface extended with ageVerified, tosAccepted, sensoryConsentGiven, aiDisclosureShown flags
- OPENAI_API_KEY added to Zod env validation for moderation API (Plan 02) and LLM generation (Phase 3)
- Migration SQL generated for all schema changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend database schema with consent columns and consent_records table** - `1b1c52f` (feat)
2. **Task 2: Create consent server actions, check functions, constants, and extend proxy.ts** - `4e06e5d` (feat)

## Files Created/Modified
- `src/lib/db/schema.ts` - Added boolean import, consent timestamp columns to usersTable, new consentRecordsTable
- `src/lib/env.ts` - Added OPENAI_API_KEY validation
- `src/lib/session-store.ts` - Extended SessionState interface with consent flags
- `drizzle/0001_conscious_klaw.sql` - Migration: CREATE TABLE consent_records, ALTER TABLE users ADD consent columns
- `src/lib/consent/constants.ts` - AI_DISCLOSURE_TEXT, HELPLINE_RESOURCES, CONSENT_TYPES, CONSENT_VERSION
- `src/lib/consent/checks.ts` - ConsentStatus interface and getUserConsentStatus function
- `src/lib/consent/index.ts` - Barrel export for consent module
- `src/actions/consent.ts` - verifyAge, acceptTerms, recordSensoryConsent server actions
- `src/proxy.ts` - Extended with consent enforcement, session route protection, legal route passthrough

## Decisions Made
- DOB is processed server-side for age calculation but never persisted -- only the ageVerifiedAt timestamp is stored, following GDPR data minimization principles
- consent-complete cookie is set with httpOnly, secure (in production), sameSite lax, 7-day maxAge -- only set when all three required consents (age, ToS, privacy) are complete
- Sensory consent is recorded in the audit log but does not update a usersTable column, because it is per-session consent not permanent consent
- Batch insert used for ToS and privacy consent records (single db.insert() with array) since they are accepted together

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

**OPENAI_API_KEY required for Plan 02 (moderation API) and Phase 3 (LLM generation).** Add to `.env.local`:
- `OPENAI_API_KEY` - Get from OpenAI Dashboard -> API keys -> Create new secret key (https://platform.openai.com/api-keys)

Note: The moderation API is free to use. The key is validated by the Zod env schema but is not consumed by any Plan 01 code yet.

## Next Phase Readiness
- Consent data layer complete -- Plan 02 (content safety filtering) can build on this schema
- Plan 03 (consent UI components) can import consent server actions and constants
- proxy.ts consent enforcement ready -- will redirect users once consent UI pages exist
- getUserConsentStatus available for server-side consent checks in any protected page
- Migration must be applied to database before consent flows work: `DATABASE_URL=$DATABASE_URL_UNPOOLED npx drizzle-kit migrate`

## Self-Check: PASSED

All 5 created files verified on disk. All 4 modified files verified on disk. Both task commits (1b1c52f, 4e06e5d) verified in git log.

---
*Phase: 02-safety-consent-framework*
*Completed: 2026-02-21*
