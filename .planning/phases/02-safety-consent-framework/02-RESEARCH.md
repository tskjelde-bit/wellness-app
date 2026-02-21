# Phase 2: Safety & Consent Framework - Research

**Researched:** 2026-02-21
**Domain:** Age verification, AI disclosure, consent tracking, content safety filtering (system prompt + OpenAI Moderation API + keyword blocklist), crisis detection, ephemeral data design, privacy/ToS
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SAFE-01 | User must confirm age (18+) before accessing any session content | DOB-based age gate at registration or first access; store `ageVerifiedAt` timestamp in users table; enforce in proxy.ts + server-side auth check; see Architecture Pattern 1 |
| SAFE-02 | User receives clear AI disclosure at session start ("This is an AI guide") | Static disclosure component rendered at session start; disclosure text stored as constant; no API call needed; see Architecture Pattern 2 |
| SAFE-03 | User provides explicit consent before body awareness / sensory content phases | Consent gate with boolean + timestamp stored in PostgreSQL `consent_records` table; checked server-side before phase progression; see Architecture Pattern 3 |
| SAFE-04 | System enforces content safety guardrails via layered filtering (system prompt + output classifier + keyword blocklist) | Three-layer filter: (1) system prompt instructions, (2) OpenAI Moderation API `omni-moderation-latest` as output classifier, (3) custom keyword blocklist module; see Architecture Patterns 4-6 |
| SAFE-05 | AI gracefully redirects boundary-pushing requests without breaking session immersion | System prompt engineering with redirect instructions + pre-written fallback responses; moderation API flags trigger graceful redirect instead of hard error; see Architecture Pattern 5 |
| SAFE-06 | System detects crisis language (self-harm, distress) and provides helpline resources | OpenAI Moderation API `self-harm`, `self-harm/intent`, `self-harm/instructions` categories + supplementary keyword list; triggers helpline resource response; see Architecture Pattern 7 |
| SAFE-07 | No session transcripts or recordings stored -- ephemeral by design | Redis-only session state with TTL auto-expiry; no LLM conversation history written to PostgreSQL; no audio recordings persisted; session_metadata stores only timing/duration, never content; see Architecture Pattern 8 |
| SAFE-08 | Privacy policy and terms of service presented before first session | Static `/privacy` and `/terms` pages; `tosAcceptedAt` + `privacyAcceptedAt` timestamps on users table; gate checked before session start; see Architecture Pattern 9 |
</phase_requirements>

## Summary

Phase 2 builds the safety and consent infrastructure that must be in place before any session content is generated or consumed. This phase spans four technical domains: (1) user-facing consent gates and verification flows, (2) server-side content safety filtering pipeline, (3) crisis detection and response, and (4) ephemeral data architecture ensuring no session transcripts are stored. All eight SAFE requirements are addressed through a combination of database schema changes, server-side enforcement logic, UI components, and a layered content filtering architecture.

The central technical pattern is a **three-layer content safety pipeline** that will be consumed by Phase 3 (LLM text generation). Layer 1 is the system prompt itself, which instructs the LLM to stay within wellness/sensory boundaries. Layer 2 is the OpenAI Moderation API (`omni-moderation-latest` model), which classifies every generated sentence for harmful categories (sexual/minors, violence, self-harm, hate). Layer 3 is a custom keyword blocklist that catches domain-specific terms the moderation API might miss. This pipeline does not need to integrate with actual LLM generation yet -- Phase 2 builds and tests the filtering functions; Phase 3 wires them into the streaming pipeline.

The consent infrastructure uses PostgreSQL for durable consent records (age verification, ToS acceptance, sensory content consent) and Redis for ephemeral session state. The key design decision is that consent records are **permanent audit trail** data (PostgreSQL) while session content is **strictly ephemeral** (Redis with TTL, never persisted). This separation is already established in Phase 1's architecture and Phase 2 extends it with new schema tables and enforcement logic.

**Primary recommendation:** Build the content safety filter as a standalone module (`src/lib/safety/`) with three composable layers (system prompt templates, moderation API classifier, keyword blocklist). Store all consent records in PostgreSQL with timestamps for audit trail. Enforce age verification and ToS acceptance in proxy.ts and server-side checks. Use the OpenAI Moderation API (`omni-moderation-latest`) as the primary output classifier -- it is free, supports the exact categories needed (self-harm, sexual, violence), and is already part of the OpenAI ecosystem the project will use in Phase 3.

## Standard Stack

### Core (New for Phase 2)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| openai | latest | OpenAI Moderation API client | Official SDK; `moderations.create()` with `omni-moderation-latest` model; free endpoint; detects self-harm, sexual, violence, hate categories |

### Already Installed (from Phase 1)

| Library | Version | Purpose | Phase 2 Usage |
|---------|---------|---------|---------------|
| drizzle-orm | 0.45.1 | Database schema and queries | New `consent_records` table; add age/ToS columns to users table |
| @upstash/redis | 1.36.2 | Ephemeral session state | Session state remains Redis-only; no transcript persistence |
| next-auth (Auth.js v5) | 5.0.0-beta.30 | Authentication | Extend JWT callbacks to include consent status flags |
| zod | 4.3.6 | Validation | Validate consent form inputs, age verification inputs |

### Supporting (New for Phase 2)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | Keyword blocklist | Hand-roll a simple string-matching module; domain-specific wellness blocklist does not benefit from generic profanity libraries |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| OpenAI Moderation API | @openai/guardrails (v0.2.1) | Guardrails wraps the full OpenAI client with automatic input/output validation. Adds complexity and is very new (v0.2.1, published Dec 2025). The standalone Moderation API call is simpler and sufficient for Phase 2. Guardrails could be adopted in Phase 3 if needed. |
| OpenAI Moderation API | LLM Guard (Python) | Python-only; would require a separate service. Not viable for a Node.js/Next.js stack. |
| Custom keyword blocklist | bad-words npm / @2toad/profanity | Generic profanity libraries. This project needs a domain-specific blocklist (explicit sexual terms, not general profanity). A custom list of 50-100 terms is simpler, more accurate, and has no dependencies. |
| DOB-based age gate | Third-party ID verification (Veriff, iDenfy) | Full ID verification is more legally robust but adds significant cost ($0.50-2.00/verification), vendor dependency, and UX friction. For an MVP wellness app, DOB self-declaration with timestamp audit trail is the standard starting point. Upgrade path to ID verification exists if regulations require it. |

**Installation:**

```bash
npm install openai
```

Note: `openai` is also needed for Phase 3 (LLM generation). Installing it now establishes the dependency early.

## Architecture Patterns

### Recommended Project Structure (Phase 2 additions)

```
src/
├── lib/
│   ├── safety/
│   │   ├── index.ts              # Barrel export for safety module
│   │   ├── moderation.ts         # OpenAI Moderation API wrapper
│   │   ├── keyword-blocklist.ts  # Domain-specific keyword filter
│   │   ├── crisis-detector.ts    # Crisis language detection + helpline response
│   │   └── constants.ts          # Blocklist terms, helpline resources, safety messages
│   ├── consent/
│   │   ├── index.ts              # Barrel export for consent module
│   │   ├── checks.ts             # Server-side consent verification functions
│   │   └── constants.ts          # Consent types, disclosure text, legal copy references
│   └── db/
│       └── schema.ts             # Extended with consent_records table + user columns
├── actions/
│   ├── consent.ts                # Server actions: recordAgeVerification, recordTosAcceptance, recordSensoryConsent
│   └── auth.ts                   # Extended: age verification during registration flow
├── app/
│   ├── (legal)/
│   │   ├── privacy/
│   │   │   └── page.tsx          # Privacy policy page
│   │   └── terms/
│   │       └── page.tsx          # Terms of service page
│   ├── (protected)/
│   │   ├── verify-age/
│   │   │   └── page.tsx          # Age verification gate page
│   │   └── dashboard/
│   │       └── page.tsx          # Updated to check consent status
│   └── components/
│       ├── consent/
│       │   ├── age-gate.tsx          # Age verification form (DOB input)
│       │   ├── ai-disclosure.tsx     # "This is an AI guide" disclosure banner
│       │   ├── sensory-consent.tsx   # Body awareness consent gate
│       │   └── tos-acceptance.tsx    # ToS/Privacy acceptance form
│       └── safety/
│           └── crisis-banner.tsx     # Crisis helpline resources display
├── proxy.ts                      # Extended: check age verification + ToS acceptance
```

### Pattern 1: Age Verification Gate (SAFE-01)

**What:** DOB-based age verification stored as a permanent record with server-side enforcement
**When to use:** Before any session content is accessible
**Why DOB, not checkbox:** Self-declaration checkboxes are increasingly non-compliant (Free Speech Coalition v. Paxton, June 2025). DOB provides a verifiable data point and audit trail. While not as strong as ID verification, it is the standard approach for MVP-stage products and can be upgraded later.

```typescript
// src/actions/consent.ts
"use server";

import { db } from "@/lib/db";
import { usersTable, consentRecordsTable } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";

const dobSchema = z.object({
  dateOfBirth: z.string().refine((dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
    return actualAge >= 18;
  }, { message: "You must be 18 or older" }),
});

export async function verifyAge(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = dobSchema.safeParse({
    dateOfBirth: formData.get("dateOfBirth"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const now = new Date();

  // Record consent event
  await db.insert(consentRecordsTable).values({
    userId: session.user.id,
    consentType: "age_verification",
    consentGiven: true,
    consentVersion: "1.0",
    recordedAt: now,
  });

  // Update user record
  await db
    .update(usersTable)
    .set({ ageVerifiedAt: now })
    .where(eq(usersTable.id, session.user.id));

  return { success: true };
}
```

### Pattern 2: AI Disclosure (SAFE-02)

**What:** Static disclosure component shown at session start
**When to use:** Every time a session begins

```typescript
// src/lib/consent/constants.ts
export const AI_DISCLOSURE_TEXT =
  "This is an AI guide. You are interacting with an artificial intelligence, " +
  "not a human therapist or counselor. This experience is designed for " +
  "relaxation and wellness purposes only and is not a substitute for " +
  "professional mental health care.";

export const HELPLINE_RESOURCES = {
  crisis: {
    name: "988 Suicide & Crisis Lifeline",
    phone: "988",
    text: "Text HOME to 741741",
    url: "https://988lifeline.org",
  },
  samhsa: {
    name: "SAMHSA National Helpline",
    phone: "1-800-662-4357",
    url: "https://www.samhsa.gov/find-help/national-helpline",
  },
};
```

```tsx
// src/components/consent/ai-disclosure.tsx
import { AI_DISCLOSURE_TEXT } from "@/lib/consent/constants";

export function AIDisclosure() {
  return (
    <div role="alert" aria-live="polite" className="rounded-lg bg-cream p-4 text-sm text-charcoal/80">
      <p className="font-medium text-charcoal">AI Disclosure</p>
      <p>{AI_DISCLOSURE_TEXT}</p>
    </div>
  );
}
```

### Pattern 3: Consent Records Schema (SAFE-03, SAFE-08)

**What:** PostgreSQL table for immutable consent audit trail; user table extensions for quick lookups
**When to use:** Every consent event (age verification, ToS, sensory content consent)

```typescript
// Additions to src/lib/db/schema.ts
import { boolean } from "drizzle-orm/pg-core";

// Add to usersTable definition:
// ageVerifiedAt: timestamp("age_verified_at", { mode: "date" }),
// tosAcceptedAt: timestamp("tos_accepted_at", { mode: "date" }),
// privacyAcceptedAt: timestamp("privacy_accepted_at", { mode: "date" }),

// New table: immutable consent audit log
export const consentRecordsTable = pgTable("consent_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  consentType: varchar("consent_type", { length: 50 }).notNull(),
    // Values: "age_verification", "tos_acceptance", "privacy_acceptance", "sensory_content"
  consentGiven: boolean("consent_given").notNull(),
  consentVersion: varchar("consent_version", { length: 20 }).notNull(),
    // Version of the legal document or consent gate (e.g., "1.0")
  recordedAt: timestamp("recorded_at", { mode: "date" }).defaultNow().notNull(),
  metadata: text("metadata"),
    // Optional JSON string for additional context (e.g., IP, user-agent for audit)
});
```

### Pattern 4: OpenAI Moderation API Wrapper (SAFE-04, Layer 2)

**What:** Thin wrapper around the OpenAI Moderation API for classifying LLM output
**When to use:** Every sentence generated by the LLM passes through this before being sent to TTS or client

```typescript
// src/lib/safety/moderation.ts
import OpenAI from "openai";

const openai = new OpenAI(); // Uses OPENAI_API_KEY env var

export interface ModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
  scores: Record<string, number>;
  isCrisis: boolean; // self-harm detected
}

export async function moderateContent(text: string): Promise<ModerationResult> {
  const response = await openai.moderations.create({
    model: "omni-moderation-latest",
    input: text,
  });

  const result = response.results[0];

  const isCrisis =
    result.categories["self-harm"] ||
    result.categories["self-harm/intent"] ||
    result.categories["self-harm/instructions"];

  return {
    flagged: result.flagged,
    categories: result.categories,
    scores: result.category_scores,
    isCrisis,
  };
}
```

### Pattern 5: Graceful Redirect for Boundary-Pushing Content (SAFE-05)

**What:** Pre-written fallback responses that maintain session immersion when content is blocked
**When to use:** When moderation or keyword filter flags content

```typescript
// src/lib/safety/constants.ts
export const SAFETY_FALLBACKS = [
  "Let's gently bring our attention back to the breath. Feel the slow rhythm of each inhale and exhale...",
  "Notice the warmth of your hands resting comfortably. Let that warmth spread slowly through your body...",
  "Let's take a moment to ground ourselves. Feel the surface beneath you, solid and supportive...",
  "Returning to this peaceful space, let's focus on what feels good and safe right now...",
] as const;

export function getRandomFallback(): string {
  return SAFETY_FALLBACKS[Math.floor(Math.random() * SAFETY_FALLBACKS.length)];
}

// Keyword blocklist terms -- explicit sexual, violent, and inappropriate terms
// that the moderation API might miss due to being domain-adjacent to wellness content
export const KEYWORD_BLOCKLIST: string[] = [
  // Populate with domain-specific terms during implementation
  // Categories: explicit sexual acts, graphic violence, substance abuse instructions
  // This list is intentionally not included in research -- it will be curated during planning
];
```

### Pattern 6: Three-Layer Content Safety Filter (SAFE-04, Combined)

**What:** Composable pipeline that applies all three safety layers in sequence
**When to use:** Every piece of LLM-generated content before it reaches TTS or client

```typescript
// src/lib/safety/index.ts
import { moderateContent, type ModerationResult } from "./moderation";
import { checkKeywordBlocklist } from "./keyword-blocklist";
import { detectCrisis, type CrisisDetectionResult } from "./crisis-detector";
import { getRandomFallback } from "./constants";

export interface SafetyCheckResult {
  safe: boolean;
  original: string;
  output: string; // Either original text or fallback
  moderationResult: ModerationResult | null;
  crisisDetected: boolean;
  blockedBy: "none" | "moderation" | "keyword" | "crisis";
}

export async function checkContentSafety(text: string): Promise<SafetyCheckResult> {
  // Layer 1: System prompt is applied upstream (at LLM call time)
  // This function handles Layers 2 and 3

  // Layer 2: OpenAI Moderation API
  const moderationResult = await moderateContent(text);

  if (moderationResult.isCrisis) {
    return {
      safe: false,
      original: text,
      output: getRandomFallback(),
      moderationResult,
      crisisDetected: true,
      blockedBy: "crisis",
    };
  }

  if (moderationResult.flagged) {
    return {
      safe: false,
      original: text,
      output: getRandomFallback(),
      moderationResult,
      crisisDetected: false,
      blockedBy: "moderation",
    };
  }

  // Layer 3: Keyword blocklist
  const keywordResult = checkKeywordBlocklist(text);
  if (keywordResult.blocked) {
    return {
      safe: false,
      original: text,
      output: getRandomFallback(),
      moderationResult,
      crisisDetected: false,
      blockedBy: "keyword",
    };
  }

  return {
    safe: true,
    original: text,
    output: text,
    moderationResult,
    crisisDetected: false,
    blockedBy: "none",
  };
}
```

### Pattern 7: Crisis Detection and Helpline Response (SAFE-06)

**What:** Detect crisis language and provide helpline resources
**When to use:** If moderation API flags self-harm categories, or if supplementary keyword list triggers

```typescript
// src/lib/safety/crisis-detector.ts
import { HELPLINE_RESOURCES } from "@/lib/consent/constants";

// Supplementary crisis keywords beyond what OpenAI Moderation catches
const CRISIS_KEYWORDS = [
  "kill myself", "want to die", "end my life", "suicide",
  "self harm", "self-harm", "cutting myself", "hurt myself",
  "no reason to live", "better off dead",
];

export interface CrisisDetectionResult {
  detected: boolean;
  helplineResponse: string | null;
}

export function detectCrisisKeywords(text: string): CrisisDetectionResult {
  const lower = text.toLowerCase();
  const detected = CRISIS_KEYWORDS.some((keyword) => lower.includes(keyword));

  if (!detected) {
    return { detected: false, helplineResponse: null };
  }

  return {
    detected: true,
    helplineResponse: buildHelplineMessage(),
  };
}

function buildHelplineMessage(): string {
  const { crisis, samhsa } = HELPLINE_RESOURCES;
  return (
    `I want you to know that you matter, and support is available right now. ` +
    `If you're in crisis, please reach out to the ${crisis.name} by calling or texting ${crisis.phone}, ` +
    `or ${crisis.text}. You can also contact the ${samhsa.name} at ${samhsa.phone}. ` +
    `These services are free, confidential, and available 24/7.`
  );
}
```

### Pattern 8: Ephemeral Data Architecture (SAFE-07)

**What:** Ensure no session transcripts or audio recordings are ever persisted
**When to use:** Architectural constraint enforced across all session-related code

```
WHAT IS STORED (PostgreSQL - permanent):
  - User accounts (users table)
  - Consent records (consent_records table) -- audit trail
  - Session metadata (session_metadata table) -- timing only: startedAt, endedAt, durationSeconds
  - NEVER: conversation content, LLM prompts, LLM responses, audio data

WHAT IS STORED (Redis - ephemeral, TTL auto-expiry):
  - Active session state: current phase, consent flags for current session
  - NEVER: conversation history, message content, audio buffers
  - TTL: 1 hour (SESSION_TTL = 3600)

WHAT IS NEVER STORED (anywhere):
  - LLM conversation history / transcripts
  - System prompts with user-specific content
  - Audio recordings or TTS output
  - User input text during sessions
```

The existing `SessionState` interface from Phase 1 should be extended in Phase 2:

```typescript
// Extended SessionState for Phase 2 (in session-store.ts)
export interface SessionState {
  userId: string;
  createdAt: number;
  // Phase 2 additions:
  ageVerified: boolean;
  tosAccepted: boolean;
  sensoryConsentGiven: boolean;
  aiDisclosureShown: boolean;
}
```

### Pattern 9: ToS/Privacy Gate (SAFE-08)

**What:** Present ToS and privacy policy before first session; record acceptance
**When to use:** After registration, before any session content is accessible

```typescript
// src/lib/consent/checks.ts
import { db } from "@/lib/db";
import { usersTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface ConsentStatus {
  ageVerified: boolean;
  tosAccepted: boolean;
  privacyAccepted: boolean;
  allRequiredConsentsGiven: boolean;
}

export async function getUserConsentStatus(userId: string): Promise<ConsentStatus> {
  const [user] = await db
    .select({
      ageVerifiedAt: usersTable.ageVerifiedAt,
      tosAcceptedAt: usersTable.tosAcceptedAt,
      privacyAcceptedAt: usersTable.privacyAcceptedAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    return {
      ageVerified: false,
      tosAccepted: false,
      privacyAccepted: false,
      allRequiredConsentsGiven: false,
    };
  }

  const ageVerified = user.ageVerifiedAt !== null;
  const tosAccepted = user.tosAcceptedAt !== null;
  const privacyAccepted = user.privacyAcceptedAt !== null;

  return {
    ageVerified,
    tosAccepted,
    privacyAccepted,
    allRequiredConsentsGiven: ageVerified && tosAccepted && privacyAccepted,
  };
}
```

### Anti-Patterns to Avoid

- **Storing LLM conversation history in PostgreSQL:** Violates SAFE-07. Session content must be strictly ephemeral. If debugging is needed, use structured logging with no PII, not database storage.
- **Using a simple checkbox for age verification:** Self-declaration checkboxes are increasingly non-compliant. Use DOB entry with server-side age calculation. The DOB is not stored -- only the verification timestamp.
- **Relying solely on system prompt for content safety:** System prompts can be circumvented by creative prompting. The three-layer approach (system prompt + moderation API + keyword blocklist) provides defense-in-depth.
- **Blocking content with hard error messages:** When content is flagged, replace it with a wellness-appropriate fallback that maintains session immersion. Never show "Content blocked" or "Safety violation" to the user.
- **Making consent checks client-side only:** All consent verification must happen server-side. Client-side checks are UX niceties, not security measures. The proxy.ts optimistic check is supplemented by auth() + database checks in the page/action.
- **Storing the user's date of birth:** The DOB is used only for age calculation. Store the `ageVerifiedAt` timestamp, not the actual birth date. This minimizes PII collection per GDPR data minimization principles.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Content classification (sexual, violence, self-harm) | Custom ML classifier or regex-based detection | OpenAI Moderation API (`omni-moderation-latest`) | Free, high accuracy (95%), supports 40+ languages, 13 categories including self-harm subcategories. Building a custom classifier is months of work. |
| LLM output safety wrapping | Custom middleware chain | `openai.moderations.create()` per sentence | The API is purpose-built for this exact use case. Returns category scores for nuanced thresholds. |
| Privacy policy / ToS document generation | Writing legal documents from scratch | Generator tools (Termly, GetTerms) or legal template adapted by counsel | Legal documents need professional review for adult wellness content. Generate a template, then customize. |

**Key insight:** The OpenAI Moderation API is free and purpose-built for exactly this use case. It detects the precise categories needed (self-harm, sexual, violence) with high accuracy. The keyword blocklist supplements it for domain-specific edge cases. There is no reason to build a custom classifier.

## Common Pitfalls

### Pitfall 1: Moderation API Latency in Streaming Pipeline

**What goes wrong:** Adding moderation API calls per-sentence adds 100-300ms latency per chunk, causing noticeable gaps in audio streaming.
**Why it happens:** The moderation API is a network call. In Phase 4's streaming pipeline, every sentence must be classified before being sent to TTS.
**How to avoid:** Phase 2 builds the moderation function as a standalone module. Phase 3/4 will need to handle this with parallel processing (fire-and-forget moderation alongside TTS, with ability to interrupt if flagged). Design the safety module to be async and non-blocking.
**Warning signs:** Audio playback gaps, user-perceptible pauses between sentences.

### Pitfall 2: Over-Triggering on Wellness Content

**What goes wrong:** The moderation API flags legitimate wellness content (body awareness, breathing exercises, sensory descriptions) as "sexual" due to proximity to intimate language.
**Why it happens:** The moderation API's `sexual` category can be triggered by body-related language that is appropriate in a wellness context. Words like "body," "touch," "sensation," "warmth," "intimate" are normal in this domain.
**How to avoid:** Use `category_scores` with custom thresholds rather than relying on the binary `flagged` field. Set a higher threshold for the `sexual` category (e.g., 0.8 instead of default) while keeping `self-harm` and `violence` thresholds low. Test extensively with actual wellness content samples.
**Warning signs:** High false-positive rate on legitimate session content, constant fallback responses interrupting normal sessions.

### Pitfall 3: Consent State Desync Between PostgreSQL and Redis

**What goes wrong:** User completes consent in the UI, but the Redis session state still shows `sensoryConsentGiven: false`, blocking the session.
**Why it happens:** Consent is recorded in PostgreSQL (permanent) but session state lives in Redis (ephemeral). If the Redis state is not updated when consent is recorded, or if Redis TTL expires mid-session, there is a desync.
**How to avoid:** When recording consent in PostgreSQL, also update the Redis session state in the same server action. On session start, populate Redis session state from PostgreSQL consent records. Redis is the fast-path cache; PostgreSQL is the source of truth.
**Warning signs:** Users completing consent but still being blocked, or consent appearing to "reset" after a period of inactivity.

### Pitfall 4: Blocking Instead of Redirecting

**What goes wrong:** Safety filter returns an error or empty response instead of a graceful wellness-appropriate fallback, breaking the session experience.
**Why it happens:** Developer instinct is to throw errors or return empty strings when content is blocked. In a voice-guided session, silence or errors destroy immersion.
**How to avoid:** The safety filter ALWAYS returns content -- either the original (if safe) or a pre-written fallback (if blocked). The `SafetyCheckResult.output` field always contains a string that can be sent to TTS. Never return null/empty from the safety pipeline.
**Warning signs:** Silent gaps in sessions, error messages being spoken by TTS, session state getting stuck.

### Pitfall 5: Age Verification Not Enforced at Proxy Level

**What goes wrong:** Users can bypass age verification by navigating directly to session URLs.
**Why it happens:** Age verification is only checked on the verification page, not on all protected routes.
**How to avoid:** Extend proxy.ts to check for age verification cookie/flag on ALL session-related routes. This is an optimistic check (cookie exists?). Server-side pages verify against the database.
**Warning signs:** Unverified users accessing session content, consent audit showing gaps.

### Pitfall 6: Not Versioning Consent Documents

**What goes wrong:** Legal documents are updated but existing consent records reference the old version. No way to know which version a user agreed to.
**Why it happens:** Privacy policies and ToS change over time. Without versioning, old consent records become ambiguous.
**How to avoid:** The `consent_records` table includes a `consentVersion` field. When documents are updated, increment the version. Users who accepted an old version may need to re-accept.
**Warning signs:** Inability to demonstrate which version of ToS a specific user accepted during an audit.

## Code Examples

### Keyword Blocklist Implementation

```typescript
// src/lib/safety/keyword-blocklist.ts

// Domain-specific terms that the moderation API may not catch
// because they are not in standard harmful content categories
// but are inappropriate for this wellness context
const BLOCKLIST_TERMS: string[] = [
  // Explicit sexual terms beyond wellness boundaries
  // Populated during implementation with actual terms
  // Keep this list in a separate constants file for easy updates
];

export interface KeywordCheckResult {
  blocked: boolean;
  matchedTerm: string | null;
}

export function checkKeywordBlocklist(text: string): KeywordCheckResult {
  const lower = text.toLowerCase();

  for (const term of BLOCKLIST_TERMS) {
    // Word-boundary matching to avoid false positives
    // e.g., "therapist" should not match "the rapist"
    const regex = new RegExp(`\\b${escapeRegex(term)}\\b`, "i");
    if (regex.test(lower)) {
      return { blocked: true, matchedTerm: term };
    }
  }

  return { blocked: false, matchedTerm: null };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
```

### Consent Enforcement in proxy.ts

```typescript
// Extended proxy.ts for Phase 2
import { NextRequest, NextResponse } from "next/server";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie =
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token");

  // Consent status cookie (set by server actions after consent is recorded)
  const consentComplete = request.cookies.get("consent-complete");

  const isProtectedRoute = pathname.startsWith("/dashboard");
  const isSessionRoute = pathname.startsWith("/session");
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isConsentRoute =
    pathname.startsWith("/verify-age") || pathname.startsWith("/accept-terms");
  const isLegalRoute =
    pathname.startsWith("/privacy") || pathname.startsWith("/terms");

  // Not logged in -> redirect to login (except legal pages)
  if ((isProtectedRoute || isSessionRoute) && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logged in but consent not complete -> redirect to consent flow
  // (except consent and legal pages themselves)
  if (isSessionRoute && sessionCookie && !consentComplete && !isConsentRoute && !isLegalRoute) {
    return NextResponse.redirect(new URL("/verify-age", request.url));
  }

  // Already logged in -> redirect away from auth pages
  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/session/:path*",
    "/login",
    "/register",
    "/verify-age",
    "/accept-terms",
  ],
};
```

### System Prompt Safety Instructions (Layer 1)

```typescript
// src/lib/safety/system-prompt-safety.ts
// These instructions are prepended to the LLM system prompt in Phase 3

export const SAFETY_SYSTEM_PROMPT = `
CRITICAL SAFETY INSTRUCTIONS -- NEVER OVERRIDE:

1. You are a wellness and relaxation guide. You MUST stay within the domains of:
   - Breathing exercises and body awareness
   - Guided relaxation and meditation
   - Sensory awareness (touch, warmth, comfort, grounding)
   - Emotional check-ins and gentle reflection

2. You MUST NOT generate content that is:
   - Sexually explicit or graphic
   - Violent or threatening
   - Related to substance use or abuse
   - Medical advice or diagnosis
   - Therapeutic claims or clinical guidance

3. If a user attempts to redirect the session toward inappropriate content:
   - Do NOT acknowledge or repeat the inappropriate request
   - Gently redirect back to the current wellness exercise
   - Use phrases like "Let's bring our focus back to..." or "Returning to our practice..."
   - Maintain a warm, calm tone throughout

4. If a user expresses distress, self-harm ideation, or crisis language:
   - Respond with compassion and care
   - Provide crisis helpline information: 988 Suicide & Crisis Lifeline (call/text 988)
   - Do NOT attempt to provide therapy or crisis counseling
   - Encourage the user to reach out to a professional

5. You are an AI guide, not a therapist. If asked, clearly state this.
`;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Simple "Are you 18?" checkbox | DOB-based age verification with audit trail | 2025 (Free Speech Coalition v. Paxton) | Self-declaration increasingly non-compliant; DOB provides verifiable data point |
| text-moderation-latest model | omni-moderation-latest model | Mid-2025 (OpenAI) | 42% improvement on multilingual tests; supports image+text; expanded categories including illicit content |
| Single-layer content filtering (system prompt only) | Multi-layer defense-in-depth (system prompt + classifier + blocklist) | 2025 industry consensus | System prompts alone are insufficient; layered approach is the standard for production LLM applications |
| Storing all chat history for debugging | Zero data retention / ephemeral architecture | 2025 GDPR enforcement trend | Data minimization principle; process in volatile memory; never persist conversation content |
| @openai/guardrails not available | @openai/guardrails v0.2.1 | Dec 2025 | New OpenAI-official option for wrapping the client with automatic safety checks; very new, still v0.x |

**Deprecated/outdated:**
- `text-moderation-stable` / `text-moderation-latest`: Legacy models. Use `omni-moderation-latest` for all new implementations. Legacy models have fewer categories and no image support.
- Simple age checkboxes: No longer considered adequate for adult content verification in many US jurisdictions post-2025.

## Open Questions

1. **Moderation API threshold tuning for wellness content**
   - What we know: The `omni-moderation-latest` model returns `category_scores` (0-1) alongside binary `flagged`. Wellness content may trigger the `sexual` category at low scores due to body-related language.
   - What's unclear: The exact threshold needed to avoid false positives on legitimate wellness content without missing actual violations. This requires testing with real session content samples.
   - Recommendation: Start with custom thresholds: `sexual` at 0.8, `self-harm` at 0.3, `violence` at 0.5. Tune based on testing. Log (without storing content) the frequency of flags during development.

2. **Legal review of privacy policy and ToS for adult wellness AI**
   - What we know: Generator tools (Termly, GetTerms) produce baseline documents. Adult wellness + AI-generated content + voice interaction creates unique legal requirements.
   - What's unclear: Whether generated templates adequately cover AI disclosure requirements, adult content disclaimers, and ephemeral data handling commitments.
   - Recommendation: Use a generator for v1 placeholder content. Flag for professional legal review before public launch. The ToS versioning system supports future document updates.

3. **DOB vs. ID verification upgrade path**
   - What we know: DOB-based verification is the current implementation. US regulatory trend is toward stronger verification (ID-based). Free Speech Coalition v. Paxton (June 2025) upheld Texas age verification law.
   - What's unclear: Whether this product's content classification ("wellness") triggers the same age verification requirements as explicit adult content. The product explicitly excludes explicit content.
   - Recommendation: Ship with DOB-based verification. Design the consent system to be extensible (the `consentType` field can support future verification types). If regulations require ID verification, services like Veriff or iDenfy can be integrated with the existing consent_records schema.

4. **OPENAI_API_KEY environment variable for moderation**
   - What we know: The OpenAI Moderation API is free to use but still requires an API key. The `openai` npm package reads `OPENAI_API_KEY` from environment.
   - What's unclear: Whether the project has an OpenAI API key configured yet (Phase 3 will need it for LLM generation too).
   - Recommendation: Add `OPENAI_API_KEY` to env.ts validation now. The moderation API is free, so there is no cost concern. This prepares the infrastructure for Phase 3.

## Sources

### Primary (HIGH confidence)
- [OpenAI Moderation API Guide](https://developers.openai.com/docs/guides/moderation) -- Full category reference, omni-moderation-latest model, JavaScript examples, response format
- [OpenAI Moderation API Reference](https://platform.openai.com/docs/api-reference/moderations/create) -- Endpoint specification, request/response schema
- [OpenAI omni-moderation-latest model page](https://platform.openai.com/docs/models/omni-moderation-latest) -- Model capabilities, supported categories, multi-modal support
- [Drizzle ORM PostgreSQL column types](https://orm.drizzle.team/docs/column-types/pg) -- boolean, timestamp, varchar column definitions for consent schema
- [OpenAI Guardrails TypeScript quickstart](https://openai.github.io/openai-guardrails-js/quickstart/) -- @openai/guardrails v0.2.1 installation, configuration, available guardrails

### Secondary (MEDIUM confidence)
- [OpenAI Upgrading the Moderation API blog](https://openai.com/index/upgrading-the-moderation-api-with-our-new-multimodal-moderation-model/) -- omni-moderation-latest launch announcement, 42% multilingual improvement
- [LLM Guardrails: Strategies & Best Practices 2025](https://www.leanware.co/insights/llm-guardrails) -- Layered safety approach, defense-in-depth patterns
- [Datadog LLM Guardrails Best Practices](https://www.datadoghq.com/blog/llm-guardrails-best-practices/) -- Production guardrail implementation patterns
- [Free Speech Coalition v. Paxton (June 2025)](https://natlawreview.com/article/new-age-verification-reality-compliance-rapidly-expanding-state-regulatory) -- Supreme Court upholds Texas age verification; self-declaration insufficient
- [Zero Data Retention and the Case for Ephemeral AI](https://www.ada.cx/blog/zero-retention-zero-risk-the-case-for-ephemeral-ai/) -- Ephemeral data architecture patterns, volatile memory processing
- [Privacy by Design GDPR 2025 Guide](https://secureprivacy.ai/blog/privacy-by-design-gdpr-2025) -- Data minimization principles, privacy-first architecture
- [Ultimate Guide to Data Privacy for Emotional Support Apps](https://www.gaslightingcheck.com/blog/ultimate-guide-to-data-privacy-for-emotional-support-apps) -- Wellness app specific privacy considerations

### Tertiary (LOW confidence)
- [Ensuring AI Safety in Production (MarkTechPost)](https://www.marktechpost.com/2025/09/28/ensuring-ai-safety-in-production-a-developers-guide-to-openais-moderation-and-safety-checks/) -- General guide to moderation API integration patterns
- [2Toad/Profanity npm](https://github.com/2Toad/Profanity) -- TypeScript profanity filter alternative; not recommended over custom blocklist for this domain
- [@openai/guardrails npm](https://www.npmjs.com/package/@openai/guardrails) -- v0.2.1, very new; noted as future consideration, not recommended for Phase 2

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- OpenAI Moderation API is officially documented, free, and verified via official docs. The `openai` npm package is the standard SDK. Drizzle ORM schema patterns are verified from Phase 1 research.
- Architecture: HIGH -- Three-layer safety pipeline is an established industry pattern verified across multiple authoritative sources. Consent schema patterns follow standard PostgreSQL audit trail design. Ephemeral data architecture extends Phase 1's Redis/PostgreSQL separation.
- Pitfalls: HIGH -- Moderation API latency concern is well-documented. Over-triggering on wellness content is a verified concern for body-related language domains. Consent desync between PostgreSQL and Redis is a known distributed state problem.

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (30 days -- OpenAI Moderation API is stable; age verification regulations are evolving but DOB approach is valid for MVP)
