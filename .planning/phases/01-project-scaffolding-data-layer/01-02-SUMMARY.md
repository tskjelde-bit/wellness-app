---
phase: 01-project-scaffolding-data-layer
plan: 02
subsystem: auth
tags: [auth.js, next-auth, credentials, jwt, bcryptjs, drizzle-adapter, proxy, route-protection]

# Dependency graph
requires:
  - phase: 01-project-scaffolding-data-layer
    provides: "Drizzle schema (usersTable), db client, bcryptjs, next-auth dependencies"
provides:
  - "Auth.js v5 configuration with Credentials provider and JWT session strategy"
  - "Sign-up server action with Zod validation and bcrypt password hashing"
  - "Sign-in server action via Auth.js with redirect handling"
  - "Sign-out server action"
  - "API route handler at /api/auth/[...nextauth]"
  - "Login page with styled form and error handling"
  - "Register page with styled form and success redirect"
  - "Protected dashboard with server-side auth() verification"
  - "proxy.ts optimistic route protection for /dashboard, /login, /register"
affects: [phase-02, phase-05, phase-06]

# Tech tracking
tech-stack:
  added: []
  patterns: [auth-credentials-jwt, server-actions-form, useActionState, proxy-route-protection, force-dynamic-pages, lazy-db-fallback]

key-files:
  created:
    - src/lib/auth.ts
    - src/app/api/auth/[...nextauth]/route.ts
    - src/actions/auth.ts
    - src/proxy.ts
    - src/components/auth/login-form.tsx
    - src/components/auth/register-form.tsx
    - src/app/(auth)/login/page.tsx
    - src/app/(auth)/register/page.tsx
    - src/app/(protected)/dashboard/page.tsx
  modified:
    - src/app/page.tsx
    - src/lib/db/index.ts

key-decisions:
  - "Used placeholder DATABASE_URL fallback in db/index.ts so neon() does not crash at build time when credentials are not yet configured"
  - "Added export dynamic = 'force-dynamic' on dashboard page to prevent pre-rendering attempts that require database access"
  - "signUp and signInAction use useActionState-compatible signatures with _prevState as first parameter"

patterns-established:
  - "Auth server actions: use 'use server' directive, Zod validation, return {error} or {success} objects"
  - "Form components: 'use client' with useActionState for server action integration"
  - "Route protection: two-layer (proxy.ts optimistic cookie check + auth() server-side verification)"
  - "Protected pages: export dynamic = 'force-dynamic' to avoid build-time database dependency"

requirements-completed: [INFR-01, INFR-02]

# Metrics
duration: 3min
completed: 2026-02-21
---

# Phase 1 Plan 02: Auth.js v5 Authentication Summary

**Auth.js v5 with Credentials provider, JWT sessions, sign-up/sign-in server actions, login/register pages, and proxy.ts route protection**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-21T08:01:47Z
- **Completed:** 2026-02-21T08:05:12Z
- **Tasks:** 2
- **Files modified:** 9 created, 2 modified

## Accomplishments
- Auth.js v5 configured with Credentials provider, DrizzleAdapter, and JWT session strategy with user.id propagation through callbacks
- Sign-up server action validates with Zod, hashes passwords with bcrypt (cost 12), checks for duplicate emails
- Sign-in server action authenticates via Auth.js with proper NEXT_REDIRECT re-throw handling
- Login and register pages with styled forms using useActionState for error display and pending states
- Protected dashboard verifies session server-side with auth() and displays user info with sign-out button
- proxy.ts provides optimistic route protection checking session cookie existence
- Full production build succeeds with all routes correctly categorized (static vs dynamic)

## Task Commits

Each task was committed atomically:

1. **Task 1: Configure Auth.js v5 with Credentials provider, JWT strategy, and API route handler** - `8fd5203` (feat)
2. **Task 2: Create login/register pages, protected dashboard, and route protection via proxy.ts** - `be25c63` (feat)

## Files Created/Modified
- `src/lib/auth.ts` - Auth.js v5 configuration with Credentials provider, JWT strategy, DrizzleAdapter
- `src/app/api/auth/[...nextauth]/route.ts` - Auth.js API route handler (GET, POST)
- `src/actions/auth.ts` - Server actions: signUp, signInAction, signOutAction
- `src/proxy.ts` - Route protection via optimistic session cookie check
- `src/components/auth/login-form.tsx` - Client component login form with useActionState
- `src/components/auth/register-form.tsx` - Client component register form with useActionState
- `src/app/(auth)/login/page.tsx` - Login page rendering LoginForm
- `src/app/(auth)/register/page.tsx` - Register page rendering RegisterForm
- `src/app/(protected)/dashboard/page.tsx` - Protected dashboard with auth() and sign-out
- `src/app/page.tsx` - Updated root page with Sign In and Register links
- `src/lib/db/index.ts` - Added placeholder URL fallback for build-time safety

## Decisions Made
- Used a placeholder `DATABASE_URL` fallback in `db/index.ts` so `neon()` does not throw at module evaluation during `next build` when database credentials are not yet configured. Actual queries will fail with a connection error if the real URL is missing at runtime.
- Added `export const dynamic = "force-dynamic"` on the dashboard page so Next.js does not attempt to pre-render it during build (it requires database access via `auth()`).
- Server action signatures use `(_prevState, formData)` pattern to be compatible with React 19's `useActionState` hook.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Build-time crash from neon() with empty DATABASE_URL**
- **Found during:** Task 2 (production build verification)
- **Issue:** `neon(process.env.DATABASE_URL!)` throws when DATABASE_URL is empty string (set but blank in .env.local). Next.js build tries to evaluate the module for static analysis, causing build failure.
- **Fix:** Added placeholder URL fallback: `neon(process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost/placeholder")`. This allows module evaluation to succeed at build time while actual queries will fail with a clear connection error if DATABASE_URL is not properly configured.
- **Files modified:** src/lib/db/index.ts
- **Verification:** `npm run build` succeeds with all routes properly categorized
- **Committed in:** be25c63 (Task 2 commit)

**2. [Rule 1 - Bug] Dashboard pre-rendering attempts database access**
- **Found during:** Task 2 (production build verification)
- **Issue:** Next.js attempted to pre-render /dashboard at build time, which calls `auth()` -> imports db -> needs database connection
- **Fix:** Added `export const dynamic = "force-dynamic"` to dashboard page to force runtime-only rendering
- **Files modified:** src/app/(protected)/dashboard/page.tsx
- **Verification:** Build output shows `/dashboard` as `f (Dynamic)` instead of static
- **Committed in:** be25c63 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both auto-fixes necessary for build to succeed without database credentials. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required

**Database credentials required for full auth flow testing.** Users must configure:

1. **Neon PostgreSQL** - Set `DATABASE_URL` in `.env.local` with actual connection string
2. **Run migrations** - `DATABASE_URL=$DATABASE_URL_UNPOOLED npx drizzle-kit migrate`

Without database credentials, the app builds and serves successfully but registration/login will fail at query time.

## Next Phase Readiness
- Auth foundation complete: registration, login, logout, session persistence, route protection
- Ready for Phase 2 (Safety & Consent) to add consent verification before protected content
- proxy.ts matcher can be extended for additional protected routes in future phases
- Session user.id available in all protected pages for associating user data
- Dashboard page provides the entry point for future session content (Phase 4+)

## Self-Check: PASSED

All 9 created files verified on disk. Both task commits (8fd5203, be25c63) verified in git log.

---
*Phase: 01-project-scaffolding-data-layer*
*Completed: 2026-02-21*
