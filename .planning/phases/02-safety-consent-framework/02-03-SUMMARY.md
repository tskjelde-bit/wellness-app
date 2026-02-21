---
phase: 02-safety-consent-framework
plan: 03
subsystem: consent-ui
tags: [consent, age-verification, tos, privacy, legal-pages, ai-disclosure, sensory-consent, crisis-helpline, tailwind]

# Dependency graph
requires:
  - phase: 02-safety-consent-framework
    plan: 01
    provides: "Consent server actions (verifyAge, acceptTerms, recordSensoryConsent), getUserConsentStatus, consent constants"
provides:
  - "Age verification page at /verify-age with DOB-based gate"
  - "Terms acceptance page at /accept-terms with dual ToS + privacy checkboxes"
  - "Privacy policy page at /privacy (static, no auth required)"
  - "Terms of service page at /terms (static, no auth required)"
  - "AIDisclosure presentational component with role=alert accessibility"
  - "SensoryConsent client component with consent/skip options"
  - "CrisisBanner component with 988 Lifeline and SAMHSA tel: links"
  - "Dashboard consent enforcement redirecting unconsented users"
affects: [03-llm-text-generation, 05-session-orchestration, 06-ui-frontend]

# Tech tracking
tech-stack:
  added: []
  patterns: [consent-flow-redirect-chain, legal-route-group, presentational-safety-components]

key-files:
  created:
    - src/components/consent/age-gate.tsx
    - src/components/consent/tos-acceptance.tsx
    - src/components/consent/ai-disclosure.tsx
    - src/components/consent/sensory-consent.tsx
    - src/components/safety/crisis-banner.tsx
    - src/app/(protected)/verify-age/page.tsx
    - src/app/(protected)/accept-terms/page.tsx
    - src/app/(legal)/privacy/page.tsx
    - src/app/(legal)/terms/page.tsx
  modified:
    - src/app/(protected)/dashboard/page.tsx

key-decisions:
  - "Legal pages use (legal) route group to keep them outside (protected) group, accessible without authentication"
  - "Consent flow uses server-side redirect chain: dashboard checks consent -> verify-age -> accept-terms -> dashboard"
  - "SensoryConsent accepts onConsent/onSkip callback props for flexible session integration"

patterns-established:
  - "Consent flow redirect chain: /verify-age -> /accept-terms -> /dashboard, enforced server-side in each page"
  - "Legal route group: (legal) for pages accessible without auth (privacy, terms)"
  - "Presentational safety components: AIDisclosure and CrisisBanner are server components importing from constants"
  - "Client consent components: AgeGate, TosAcceptance, SensoryConsent use useActionState + useRouter pattern from Phase 1"

requirements-completed: [SAFE-01, SAFE-02, SAFE-03, SAFE-08]

# Metrics
duration: 3min
completed: 2026-02-21
---

# Phase 2 Plan 03: Consent & Safety UI Components Summary

**Age verification page, ToS/privacy acceptance flow, static legal pages, AI disclosure component, sensory consent gate, and crisis helpline banner with 988/SAMHSA tel: links -- all styled in wellness theme (blush/rose/charcoal)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-21T08:34:15Z
- **Completed:** 2026-02-21T08:36:58Z
- **Tasks:** 2
- **Files modified:** 10 (9 created, 1 modified)

## Accomplishments
- Age gate component with DOB input, max-date validation, useActionState binding to verifyAge server action, and redirect to /accept-terms on success
- ToS acceptance component with dual checkboxes (client-side disabled state until both checked), links to legal pages, useActionState binding to acceptTerms, redirect to /dashboard on success
- Verify-age and accept-terms server pages with consent status checks and smart redirect logic (skip steps already completed)
- Dashboard updated to enforce full consent flow via getUserConsentStatus -- redirects to appropriate consent step if incomplete
- Privacy policy page with sections on data collection, data NOT collected (session transcripts, DOB), retention, third parties, and user rights
- Terms of service page covering service description, eligibility (18+), AI disclosure, acceptable use, content disclaimer, and liability
- AIDisclosure presentational component with role="alert" and aria-live="polite" rendering AI_DISCLOSURE_TEXT from constants
- SensoryConsent client component with consent/skip options, useActionState binding to recordSensoryConsent, callback props for session integration
- CrisisBanner component displaying 988 Lifeline and SAMHSA resources with clickable tel: links for mobile

## Task Commits

Each task was committed atomically:

1. **Task 1: Create consent flow pages and form components** - `ccc855d` (feat)
2. **Task 2: Create legal pages, AI disclosure, sensory consent, and crisis banner** - `d18c8cd` (feat)

## Files Created/Modified
- `src/components/consent/age-gate.tsx` - Client component: DOB-based age verification form with useActionState
- `src/components/consent/tos-acceptance.tsx` - Client component: dual checkbox ToS/privacy acceptance with disabled submit
- `src/components/consent/ai-disclosure.tsx` - Server component: AI disclosure text with ARIA accessibility attributes
- `src/components/consent/sensory-consent.tsx` - Client component: body awareness consent gate with consent/skip callbacks
- `src/components/safety/crisis-banner.tsx` - Server component: 988 Lifeline and SAMHSA helpline display with tel: links
- `src/app/(protected)/verify-age/page.tsx` - Server page: age verification gate with consent status redirect logic
- `src/app/(protected)/accept-terms/page.tsx` - Server page: ToS/privacy acceptance with age-verified guard
- `src/app/(legal)/privacy/page.tsx` - Static page: privacy policy with data minimization emphasis
- `src/app/(legal)/terms/page.tsx` - Static page: terms of service with wellness service scope
- `src/app/(protected)/dashboard/page.tsx` - Modified: added getUserConsentStatus check and consent redirect enforcement

## Decisions Made
- Legal pages placed in `(legal)` route group to keep them outside the `(protected)` group, making them accessible without authentication as required
- Consent flow uses server-side redirect chain enforced in each page's server component, preventing client-side bypass
- SensoryConsent component uses callback props (onConsent, onSkip) rather than built-in routing, allowing flexible integration in future session UI

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None -- all components are UI-only, consuming server actions and constants already created in Plan 01.

## Next Phase Readiness
- Phase 2 complete: all consent data layer (Plan 01), safety pipeline (Plan 02), and consent UI (Plan 03) are built
- Full consent flow operational: /verify-age -> /accept-terms -> /dashboard with server-side enforcement
- AIDisclosure and SensoryConsent components ready for Phase 5 session orchestration integration
- CrisisBanner ready for integration in session UI and crisis detection response display
- Legal pages accessible at /privacy and /terms for user review
- Database migration (from Plan 01) must be applied before consent flow works: `DATABASE_URL=$DATABASE_URL_UNPOOLED npx drizzle-kit migrate`

## Self-Check: PASSED

All 9 created files verified on disk. 1 modified file verified on disk. Both task commits (ccc855d, d18c8cd) verified in git log.

---
*Phase: 02-safety-consent-framework*
*Completed: 2026-02-21*
