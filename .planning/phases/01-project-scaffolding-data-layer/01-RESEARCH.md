# Phase 1: Project Scaffolding & Data Layer - Research

**Researched:** 2026-02-21
**Domain:** Next.js 16 project setup, PostgreSQL (Neon) + Drizzle ORM, Auth.js v5 credentials auth, Upstash Redis session store
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFR-01 | User can create account with email and password | Auth.js v5 Credentials provider + Drizzle adapter + bcryptjs password hashing; sign-up via server action that inserts user into PostgreSQL, sign-in via Auth.js authorize callback |
| INFR-02 | User session persists across browser refresh | Auth.js JWT session strategy with httpOnly cookie; proxy.ts optimistic redirect check; auth() server-side validation |
| INFR-04 | Redis-backed session state with TTL-based auto-expiry | Upstash Redis @upstash/redis with HTTP-based client; redis.hset() + redis.expire() for session data with configurable TTL (e.g., 3600s); auto-cleanup of expired sessions |
| INFR-05 | PostgreSQL database for user accounts, consent records, and session metadata | Neon serverless PostgreSQL via @neondatabase/serverless; Drizzle ORM schema-as-code with drizzle-kit migrations; tables for users, accounts, sessions metadata |
</phase_requirements>

## Summary

Phase 1 establishes the foundational infrastructure: a Next.js 16 project with TypeScript, Tailwind CSS 4, PostgreSQL via Neon for persistent storage, Redis via Upstash for ephemeral session state, and Auth.js v5 for email/password authentication. This is the bedrock upon which all subsequent phases build.

The critical technical decision in this phase is the Auth.js v5 session strategy. Auth.js v5 Credentials provider has a known limitation: it does not natively create database session records. The recommended approach is to use JWT session strategy (the default for Credentials) with the Drizzle adapter still handling user persistence. Sign-up is a separate server action (not handled by Auth.js) that creates the user in PostgreSQL with bcryptjs-hashed password. Sign-in uses Auth.js authorize callback to verify credentials. The JWT session cookie persists across browser refresh, satisfying INFR-02. The Upstash Redis store (INFR-04) is a separate concern from Auth.js sessions -- it stores ephemeral application-level session state (future: current phase, preferences mid-session) with TTL auto-expiry.

The Neon + Drizzle + Vercel combination is well-integrated. Neon provides native Vercel integration with automatic environment variable injection, pooled connections via PgBouncer, and database branching for preview deployments. Drizzle ORM provides TypeScript-first schema definition with lightweight runtime (no binary like Prisma). The schema should be designed with future phases in mind -- consent records (Phase 2), session metadata (Phase 5) -- but only the user/auth tables need to be created now.

**Primary recommendation:** Use JWT session strategy with Auth.js v5 Credentials provider, implement sign-up as a separate server action with bcryptjs, and keep Upstash Redis as a distinct session state store for application-level ephemeral data (not Auth.js sessions).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | Full-stack framework | App Router, Turbopack default, proxy.ts replaces middleware, streaming support, Vercel-native |
| React | 19.2.4 | UI library | Ships with Next.js 16, Server Components stable |
| TypeScript | 5.9.3 | Type safety | Required for complex session/auth types |
| Tailwind CSS | 4.2.0 | Styling | CSS-first @theme config, Rust-based Oxide engine, no config file needed |

### Data Layer

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Drizzle ORM | 0.45.1 | Database access | TypeScript-first, SQL-like syntax, lightweight runtime, excellent Neon support |
| @neondatabase/serverless | 1.0.2 | PostgreSQL driver | HTTP-based serverless driver, no connection pooling headaches, Vercel-native |
| @upstash/redis | latest | Redis client | HTTP-based, serverless-compatible, pay-per-request, built-in TTL support |
| drizzle-kit | latest (dev) | Migration tooling | Generate and apply schema migrations from TypeScript schema |

### Auth

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-auth (Auth.js v5) | 5.0.0-beta.30 | Authentication framework | App Router native, universal auth() function, Drizzle adapter available |
| @auth/drizzle-adapter | latest | Database adapter | Bridges Auth.js to Drizzle ORM schema |
| bcryptjs | latest | Password hashing | Pure JS (no native binaries), edge-runtime compatible, works in serverless |

### Validation

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zod | 4.3.6 | Schema validation | Validate API inputs, form data, environment variables |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Auth.js v5 | Better Auth | Better Auth is newer with cleaner credentials support, but Auth.js is the ecosystem standard for Next.js and was chosen in stack research. Auth.js v5 beta status is a risk but widely adopted. |
| Auth.js v5 | Lucia Auth | Lucia provides more control over sessions but was deprecated in early 2025. Not recommended. |
| bcryptjs | bcrypt | bcrypt is faster (C++ bindings) but fails in edge/serverless runtimes due to native dependencies. bcryptjs is pure JS and works everywhere. |
| JWT sessions | Database sessions | Database sessions allow server-side revocation but Auth.js v5 Credentials provider does not natively create DB session records. JWT is simpler and the default for Credentials. |
| Drizzle ORM | Prisma | Prisma has larger ecosystem but adds cold-start latency from query engine binary. Drizzle is lighter and more SQL-like. |

**Installation:**

```bash
# Create Next.js project
npx create-next-app@latest female --typescript --tailwind --eslint --app --src-dir --turbopack --import-alias "@/*"

# Data layer
npm install drizzle-orm@0.45.1 @neondatabase/serverless@1.0.2
npm install @upstash/redis
npm install -D drizzle-kit

# Auth
npm install next-auth@beta @auth/drizzle-adapter bcryptjs
npm install -D @types/bcryptjs

# Validation
npm install zod@4.3.6
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   └── register/
│   │       └── page.tsx          # Registration page
│   ├── (protected)/
│   │   └── dashboard/
│   │       └── page.tsx          # Protected dashboard
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts      # Auth.js API route handler
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── auth.ts                   # Auth.js configuration (exported auth, signIn, signOut, handlers)
│   ├── db/
│   │   ├── index.ts              # Drizzle client instance
│   │   ├── schema.ts             # All Drizzle table definitions
│   │   └── migrations/           # Generated migration files
│   ├── redis.ts                  # Upstash Redis client instance
│   └── session-store.ts          # Redis session store helpers (get/set/expire)
├── actions/
│   ├── auth.ts                   # Server actions: signUp, signIn, signOut
│   └── session.ts                # Server actions: session state operations
├── components/
│   ├── auth/
│   │   ├── login-form.tsx        # Login form component
│   │   └── register-form.tsx     # Registration form component
│   └── ui/                       # Shared UI components
├── types/
│   └── index.ts                  # Shared TypeScript types
└── proxy.ts                      # Next.js 16 proxy (replaces middleware.ts)
drizzle.config.ts                 # Drizzle Kit configuration
.env.local                        # Environment variables (not committed)
```

### Pattern 1: Auth.js v5 Configuration with Credentials + Drizzle

**What:** Central auth configuration file exporting auth(), signIn, signOut, and handlers
**When to use:** Always -- this is the single source of auth truth

```typescript
// src/lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { usersTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" }, // MUST use JWT with Credentials provider
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const [user] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.email, email))
          .limit(1);

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
```

### Pattern 2: Sign-Up as Separate Server Action

**What:** User registration is NOT handled by Auth.js -- it is a standalone server action
**When to use:** Always for Credentials provider -- Auth.js does not handle user creation

```typescript
// src/actions/auth.ts
"use server";

import { db } from "@/lib/db";
import { usersTable } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { eq } from "drizzle-orm";

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function signUp(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const { name, email, password } = parsed.data;

  // Check if user already exists
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (existing) {
    return { error: "Email already registered" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(usersTable).values({
    name,
    email,
    passwordHash,
  });

  return { success: true };
}
```

### Pattern 3: Route Protection via proxy.ts + Server-Side auth()

**What:** Two-layer protection: proxy.ts for optimistic redirect, auth() for actual verification
**When to use:** All protected routes

```typescript
// src/proxy.ts (Next.js 16 -- replaces middleware.ts)
import { NextRequest, NextResponse } from "next/server";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Optimistic check: does a session cookie exist?
  // Do NOT validate the session here -- just redirect if no cookie
  const sessionCookie = request.cookies.get("authjs.session-token")
    || request.cookies.get("__Secure-authjs.session-token");

  const isProtectedRoute = pathname.startsWith("/dashboard");
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
```

```typescript
// src/app/(protected)/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth(); // Actual session verification
  if (!session) redirect("/login");

  return <div>Welcome, {session.user.name}</div>;
}
```

### Pattern 4: Upstash Redis Session Store (Application-Level)

**What:** Separate from Auth.js sessions -- stores ephemeral app state with TTL
**When to use:** Storing session-level data that expires (future: current phase, preferences)

```typescript
// src/lib/redis.ts
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Or use auto-detection:
// export const redis = Redis.fromEnv();
```

```typescript
// src/lib/session-store.ts
import { redis } from "@/lib/redis";

const SESSION_TTL = 3600; // 1 hour in seconds

interface SessionState {
  userId: string;
  createdAt: number;
  // Future phases will add: currentPhase, preferences, consentStatus
}

export async function getSessionState(sessionId: string): Promise<SessionState | null> {
  return await redis.get<SessionState>(`session:${sessionId}`);
}

export async function setSessionState(
  sessionId: string,
  state: SessionState
): Promise<void> {
  await redis.set(`session:${sessionId}`, state, { ex: SESSION_TTL });
}

export async function deleteSessionState(sessionId: string): Promise<void> {
  await redis.del(`session:${sessionId}`);
}

export async function refreshSessionTTL(sessionId: string): Promise<void> {
  await redis.expire(`session:${sessionId}`, SESSION_TTL);
}
```

### Pattern 5: Drizzle Schema with Auth.js Tables

**What:** Single schema file defining all database tables including Auth.js required tables
**When to use:** Always -- schema.ts is the source of truth for the database

```typescript
// src/lib/db/schema.ts
import {
  pgTable,
  text,
  timestamp,
  varchar,
  uuid,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";

// Auth.js required: users table (extended with passwordHash for credentials)
export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"), // Custom field for credentials auth
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// Auth.js required: accounts table (for OAuth -- included for future flexibility)
export const accountsTable = pgTable("accounts", {
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: varchar("token_type", { length: 255 }),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
}, (table) => [
  primaryKey({ columns: [table.provider, table.providerAccountId] }),
]);

// Session metadata (for tracking session history -- NOT Auth.js sessions)
export const sessionMetadataTable = pgTable("session_metadata", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { mode: "date" }).defaultNow().notNull(),
  endedAt: timestamp("ended_at", { mode: "date" }),
  durationSeconds: integer("duration_seconds"),
  // Future phases will add: sessionLength, completedPhases, moodSelection
});
```

```typescript
// src/lib/db/index.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql, schema });
```

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Anti-Patterns to Avoid

- **Using database session strategy with Credentials provider:** Auth.js v5 does not natively create DB session records for Credentials. Use JWT strategy instead. Attempting to force database sessions requires manual workarounds that are fragile and poorly documented.
- **Putting auth logic in proxy.ts:** proxy.ts should only do optimistic cookie-existence checks for UX redirects. Never validate sessions, hash passwords, or query databases in proxy.ts. Always verify with auth() server-side.
- **Using bcrypt (native) instead of bcryptjs:** bcrypt requires native compilation and breaks in serverless/edge runtimes. bcryptjs is pure JavaScript and works everywhere.
- **Storing sensitive data in JWT:** The JWT is encrypted but should only contain user ID and role. Never store passwords, tokens, or PII in the JWT payload.
- **Skipping Zod validation on credentials:** Always validate email format and password length server-side before database queries.
- **Using `drizzle-kit push` in production:** Use `drizzle-kit generate` + `drizzle-kit migrate` for production. Push is for rapid prototyping only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom crypto/hashing | bcryptjs | Timing attacks, salt generation, cost factor tuning are easy to get wrong |
| Session tokens/JWT | Manual JWT signing/verification | Auth.js v5 JWT strategy | Token rotation, expiry, httpOnly cookies, CSRF protection built-in |
| Database migrations | Raw SQL files | drizzle-kit generate + migrate | Schema drift, rollback, version tracking all handled |
| Form validation | Manual if/else checks | Zod schemas | Type inference, composable, consistent error messages |
| Redis connection management | Raw ioredis with connection pooling | @upstash/redis HTTP client | Serverless has no persistent connections; HTTP-based client avoids cold start issues |
| Environment variable validation | process.env.X || "default" | Zod + createEnv pattern | Fail fast at startup if env vars are missing, with type safety |

**Key insight:** Auth and data layer code is where security vulnerabilities live. Every hand-rolled component in this layer is a potential vulnerability. Use battle-tested libraries.

## Common Pitfalls

### Pitfall 1: Auth.js v5 Credentials + Database Sessions = Null Session

**What goes wrong:** Using `strategy: "database"` with Credentials provider causes `auth()` to return null despite successful authorize().
**Why it happens:** Auth.js v5 Credentials provider does not automatically create session records in the database. OAuth providers do; Credentials does not.
**How to avoid:** Use `session: { strategy: "jwt" }` explicitly in your Auth.js config. JWT sessions are stored as encrypted cookies and work with Credentials out of the box.
**Warning signs:** `auth()` returns null after successful login, no rows in sessions table.

### Pitfall 2: bcrypt Fails in Serverless/Edge Runtime

**What goes wrong:** `Error: Cannot find module './bcrypt_lib.node'` or similar native module errors at runtime.
**Why it happens:** bcrypt uses native C++ bindings that don't exist in serverless/edge environments.
**How to avoid:** Use bcryptjs (pure JavaScript implementation). Import as `import bcrypt from "bcryptjs"` -- same API.
**Warning signs:** Errors mentioning `.node` files, native modules, or `gyp` during build.

### Pitfall 3: middleware.ts vs proxy.ts in Next.js 16

**What goes wrong:** Using deprecated `middleware.ts` naming causes confusion or future breaking changes.
**Why it happens:** Next.js 16 renamed middleware.ts to proxy.ts. The old name still works but is deprecated.
**How to avoid:** Name the file `proxy.ts` (or `src/proxy.ts` with src dir), export a default `proxy` function. Same capabilities, new name.
**Warning signs:** Deprecation warnings in build output.

### Pitfall 4: Neon Connection String Confusion (Pooled vs Direct)

**What goes wrong:** Migrations fail silently or schema changes don't apply.
**Why it happens:** Neon provides two connection strings: `DATABASE_URL` (pooled via PgBouncer) and `DATABASE_URL_UNPOOLED` (direct). drizzle-kit migrations need the unpooled/direct connection because PgBouncer doesn't support all DDL operations.
**How to avoid:** Use `DATABASE_URL` for application runtime (pooled). Use `DATABASE_URL_UNPOOLED` in drizzle.config.ts for migrations.
**Warning signs:** Migration commands hang or produce cryptic errors about prepared statements.

### Pitfall 5: Not Separating Auth Sessions from App Sessions

**What goes wrong:** Trying to store application state (current session phase, user preferences) in Auth.js JWT leads to bloated tokens, no TTL control, and no server-side state management.
**Why it happens:** Conflating "auth session" (is the user logged in?) with "app session" (what is the user doing right now?).
**How to avoid:** Auth.js JWT handles authentication only (user ID, role). Upstash Redis handles ephemeral application state with TTL. These are separate systems.
**Warning signs:** JWT payload growing beyond user ID + basic claims, wanting to expire individual session data independently of auth.

### Pitfall 6: Forgetting to Handle Sign-Up Separately from Auth.js

**What goes wrong:** Expecting Auth.js Credentials provider to handle user registration.
**Why it happens:** OAuth providers auto-create users via the adapter. Credentials provider only authenticates existing users -- it has no built-in registration flow.
**How to avoid:** Create a separate sign-up server action that validates input, hashes password, inserts user into database, then redirect to login. Auth.js only handles sign-in.
**Warning signs:** Trying to use the `signIn` callback for user creation, or looking for a "register" method on Auth.js.

### Pitfall 7: Missing Environment Variables at Deploy Time

**What goes wrong:** App crashes at runtime with undefined env var errors instead of failing at build time.
**Why it happens:** Next.js doesn't validate environment variables by default.
**How to avoid:** Create an `env.ts` file using Zod to validate all required env vars at import time. Import it in your entry points.
**Warning signs:** `TypeError: Cannot read properties of undefined` errors in production logs.

## Code Examples

### Environment Variable Validation

```typescript
// src/lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_URL_UNPOOLED: z.string().url().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = envSchema.parse(process.env);
```

### Auth.js Route Handler

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

### Drizzle Migration Commands

```bash
# Generate migration from schema changes
npx drizzle-kit generate

# Apply migrations to database (use unpooled connection)
DATABASE_URL=$DATABASE_URL_UNPOOLED npx drizzle-kit migrate

# Quick push for development (no migration files)
npx drizzle-kit push

# Open Drizzle Studio for visual DB inspection
npx drizzle-kit studio
```

### Tailwind CSS 4 Theme Setup (for future phases)

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  --color-blush: #F8C8DC;
  --color-rose: #D63384;
  --color-charcoal: #2B2B2B;
  --color-cream: #FFF5F7;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| middleware.ts | proxy.ts | Next.js 16 (Oct 2025) | Rename file and exported function; middleware.ts deprecated |
| next/legacy/image | next/image | Next.js 16 | Legacy image component removed |
| experimental.ppr flag | cacheComponents config | Next.js 16 | PPR config replaced by Cache Components |
| Implicit caching in App Router | Explicit opt-in with "use cache" | Next.js 16 | All dynamic by default now; cache is opt-in |
| Chat Completions API | Responses API | OpenAI March 2025 | Not relevant to Phase 1 but noted for later phases |
| Prisma for serverless | Drizzle ORM | 2024-2025 trend | No binary runtime overhead; faster serverless cold starts |
| Vercel Postgres (managed) | Neon native integration | Q4 2024 | Vercel transitioned all Postgres stores to Neon marketplace integration |

**Deprecated/outdated:**
- `middleware.ts` in Next.js 16: Renamed to `proxy.ts`. Still works but deprecated and will be removed.
- `serverRuntimeConfig` / `publicRuntimeConfig`: Removed in Next.js 16. Use `.env` files instead.
- `next lint` command: Removed from `next build`. Use ESLint or Biome directly.
- Lucia Auth: Deprecated in early 2025. Do not use for new projects.

## Open Questions

1. **Auth.js v5 beta stability for production**
   - What we know: Beta.30 is widely adopted, ecosystem has standardized on it, no stable release date announced.
   - What's unclear: Whether breaking changes between beta.30 and stable will affect our Credentials + JWT setup.
   - Recommendation: Pin to `next-auth@5.0.0-beta.30` exactly. Monitor the changelog. The JWT + Credentials pattern is well-tested and unlikely to break. If critical issues arise, Better Auth is the escape hatch.

2. **Drizzle-kit migration workflow for Neon in CI/CD**
   - What we know: drizzle-kit generate creates migration SQL files. drizzle-kit migrate applies them. Pooled connections may not work for DDL.
   - What's unclear: Exact CI/CD pipeline setup for running migrations against Neon during Vercel deployments.
   - Recommendation: Use `DATABASE_URL_UNPOOLED` for migrations. Run `drizzle-kit migrate` as a build step or separate GitHub Action. For Phase 1, `drizzle-kit push` is acceptable during development.

3. **Upstash Redis region selection**
   - What we know: Upstash supports global replication. Region should match Vercel deployment region for lowest latency.
   - What's unclear: Which Vercel region the project will deploy to (depends on user base location).
   - Recommendation: Default to `us-east-1` (Vercel default). Can be changed later. Upstash global replication adds read replicas if latency becomes an issue.

## Sources

### Primary (HIGH confidence)
- [Next.js 16 release blog](https://nextjs.org/blog/next-16) -- proxy.ts, Turbopack default, breaking changes, Cache Components
- [Next.js installation docs](https://nextjs.org/docs/app/getting-started/installation) -- create-next-app setup flow
- [Auth.js Credentials provider](https://authjs.dev/getting-started/authentication/credentials) -- authorize function, JWT strategy requirement, Zod validation
- [Auth.js Drizzle adapter](https://authjs.dev/getting-started/adapters/drizzle) -- required tables, custom schema mapping, installation
- [Drizzle ORM + Neon setup](https://orm.drizzle.team/docs/get-started/neon-new) -- installation, schema, migrations, drizzle.config.ts
- [Upstash Redis + Next.js tutorial](https://upstash.com/docs/redis/tutorials/nextjs_with_redis) -- client setup, environment variables
- [Upstash session management blog](https://upstash.com/blog/session-management-nextjs) -- TTL patterns, session store implementation
- [Neon Vercel integration docs](https://neon.com/docs/guides/neon-managed-vercel-integration) -- environment variables, pooled vs unpooled connections

### Secondary (MEDIUM confidence)
- [Auth.js v5 DB session + Credentials discussion #12848](https://github.com/nextauthjs/next-auth/discussions/12848) -- Credentials provider does not create DB sessions; workaround documented
- [Auth.js session strategies](https://authjs.dev/concepts/session-strategies) -- JWT vs database strategy comparison
- [Auth.js route protection](https://authjs.dev/getting-started/session-management/protecting) -- proxy.ts pattern, auth() server-side check
- [Auth0 blog: Next.js 16 auth changes](https://auth0.com/blog/whats-new-nextjs-16/) -- proxy.ts replaces middleware for auth
- [bcryptjs vs bcrypt comparison](https://medium.com/@abdulakeemabdulafeez/bcrypt-vs-bcryptjs-the-developer-myth-i-finally-stopped-believing-c7dd54d76496) -- edge runtime compatibility

### Tertiary (LOW confidence)
- [Better Auth as Auth.js alternative](https://www.wisp.blog/blog/authjs-vs-betterauth-for-nextjs-a-comprehensive-comparison) -- contingency option if Auth.js v5 beta causes issues

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All versions verified via npm registry and official docs 2026-02-21. Stack was pre-selected in project research.
- Architecture: HIGH -- Patterns verified against official Auth.js v5, Drizzle, and Next.js 16 documentation. The JWT + Credentials + Drizzle pattern is well-documented with known gotchas.
- Pitfalls: HIGH -- Auth.js Credentials + DB session issue verified via GitHub discussion with multiple confirmations. bcryptjs edge compatibility verified via multiple sources. proxy.ts change verified in Next.js 16 release notes.

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (30 days -- stack is stable; Auth.js v5 beta may release new versions)
