---
phase: 08-payment-integration
plan: 02
subsystem: payments
tags: [ccbill, webhooks, next.js, server-actions, middleware, subscription-gating]

# Dependency graph
requires:
  - phase: 08-payment-integration
    provides: payment module with checkout URL generation, webhook handler, subscription queries
  - phase: 01-scaffolding
    provides: database schema, auth, proxy.ts middleware pattern
provides:
  - CCBill webhook POST endpoint at /api/webhooks/ccbill
  - Payment server actions (initiateCheckout, checkSubscriptionStatus)
  - Subscribe page with pricing card and CCBill checkout CTA
  - Success page with webhook race-condition polling
  - Failure page with retry option
  - Subscription gating in proxy.ts for /session/* routes
affects: [09-polish-deployment]

# Tech tracking
tech-stack:
  added: []
  patterns: [webhook-race-condition-polling, subscription-cookie-gating, form-action-redirect]

key-files:
  created:
    - src/app/api/webhooks/ccbill/route.ts
    - src/actions/payment.ts
    - src/app/(protected)/subscribe/page.tsx
    - src/app/(protected)/subscribe/success/page.tsx
    - src/app/(protected)/subscribe/failure/page.tsx
  modified:
    - src/proxy.ts

key-decisions:
  - "subscription-active cookie is httpOnly:false (readable by proxy.ts middleware) with 24h maxAge"
  - "Success page polls checkSubscriptionStatus every 2s for up to 16s to handle webhook race condition"
  - "Only /session/* routes gated behind subscription; /dashboard always accessible to authenticated+consented users"

patterns-established:
  - "Webhook race condition handling: client-side polling on success page until server confirms activation"
  - "Subscription cookie gating: proxy.ts checks subscription-active cookie for optimistic access control"
  - "Form action redirect: server action calls redirect() to external payment provider"

requirements-completed: [INFR-03]

# Metrics
duration: 2min
completed: 2026-02-21
---

# Phase 8 Plan 02: Payment Integration Wiring Summary

**CCBill webhook endpoint, checkout server actions, subscribe/success/failure pages, and proxy.ts subscription gating for session routes**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-21T11:16:43Z
- **Completed:** 2026-02-21T11:19:12Z
- **Tasks:** 3 (2 auto + 1 checkpoint auto-approved)
- **Files modified:** 6

## Accomplishments
- Webhook endpoint at /api/webhooks/ccbill receives CCBill POST events without authentication, delegates to handleWebhookEvent
- Server actions enable checkout redirect (initiateCheckout) and subscription status polling with cookie-based caching (checkSubscriptionStatus)
- Subscribe page with pink wellness theme, pricing card, and CCBill checkout CTA form action
- Success page handles webhook-vs-redirect race condition by polling subscription status every 2 seconds
- Failure page with empathetic messaging and retry option
- Proxy.ts gates /session/* routes behind subscription-active cookie while keeping /dashboard and /subscribe accessible

## Task Commits

Each task was committed atomically:

1. **Task 1: Create webhook endpoint and payment server actions** - `e0c6d0b` (feat)
2. **Task 2: Create subscribe pages and extend proxy.ts with subscription gating** - `7478879` (feat)
3. **Task 3: Verify payment integration flow** - auto-approved checkpoint (no commit)

## Files Created/Modified
- `src/app/api/webhooks/ccbill/route.ts` - CCBill webhook POST endpoint with JSON parse, error handling, no auth
- `src/actions/payment.ts` - Server actions: initiateCheckout (redirect to CCBill), checkSubscriptionStatus (poll + cookie)
- `src/app/(protected)/subscribe/page.tsx` - Subscribe page with pricing, value proposition, CCBill checkout CTA
- `src/app/(protected)/subscribe/success/page.tsx` - Client component with polling for activation (race condition handling)
- `src/app/(protected)/subscribe/failure/page.tsx` - Failure page with retry and dashboard links
- `src/proxy.ts` - Extended with subscription-active cookie check, /subscribe matcher, session route gating

## Decisions Made
- subscription-active cookie set as httpOnly:false so proxy.ts middleware can read it for optimistic access control (matches consent-complete cookie pattern but non-httpOnly since middleware needs client-visible cookie)
- Success page polls up to 8 times at 2-second intervals (16s total) to handle the race condition where browser redirect arrives before CCBill webhook
- Only /session/* routes require subscription; /dashboard remains accessible for users to manage account without subscribing
- Origin for checkout return URLs derived from request headers at runtime (x-forwarded-proto + host), falling back to AUTH_URL env var

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Self-Check: PASSED

## Next Phase Readiness
- Full payment integration complete: subscribe -> CCBill -> webhook -> activation -> session access
- Ready for Phase 9 (polish and deployment)
- CCBill merchant account must be configured with correct webhook URL before live testing
- Database migration from Plan 01 must be applied to production before payment features work

---
*Phase: 08-payment-integration*
*Completed: 2026-02-21*
