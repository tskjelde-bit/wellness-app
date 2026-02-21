# Phase 8: Payment Integration - Research

**Researched:** 2026-02-21
**Domain:** High-risk payment processing for adult wellness SaaS
**Confidence:** MEDIUM

## Summary

This phase integrates a high-risk-compatible payment processor to gate service access behind a completed payment. The critical constraint is that Stripe and PayPal are explicitly excluded because they reject adult wellness content. The three viable processors in this space are **CCBill**, **Segpay**, and **Epoch**, all of which have 20+ years of experience processing payments for high-risk adult-adjacent verticals.

The recommended approach is **CCBill** using their **FlexForms hosted payment page** (redirect model). This minimizes PCI scope (card data never touches our server), provides a well-documented REST API for backend verification, supports webhooks for event-driven state management, and is the most widely adopted processor in this exact vertical. The integration pattern is: user clicks "Subscribe" -> redirect to CCBill-hosted payment form -> CCBill posts back to our webhook -> we update subscription status in PostgreSQL.

An alternative approach using CCBill's **RESTful API with Advanced Widget** (embedded tokenization) is more complex but provides a seamless in-app payment experience. For v1, the redirect model is strongly recommended to reduce PCI compliance burden and implementation complexity.

**Primary recommendation:** Use CCBill FlexForms (redirect-based hosted payment page) for v1, with a webhook-driven subscription state model stored in PostgreSQL via Drizzle ORM.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFR-03 | Payment processor integration uses high-risk-compatible provider (not Stripe/PayPal) | CCBill recommended as primary processor; FlexForms redirect model for minimal PCI scope; webhook-driven subscription tracking in PostgreSQL; proxy.ts middleware extended for subscription gating |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| CCBill FlexForms | N/A (hosted) | Payment form / checkout UI | Industry-standard hosted payment page for high-risk merchants; no card data touches our server; PCI SAQ A eligible |
| CCBill Webhooks | JSON format | Transaction event notifications | Push-based event delivery for sale, renewal, cancellation, chargeback events |
| CCBill RESTful API | v2 | Backend transaction verification | OAuth2 client_credentials flow; charge tokens, verify transactions |
| Drizzle ORM | 0.45.x (existing) | Subscription schema / migration | Already in project; add subscriptions table + user subscription status |
| Zod | 4.x (existing) | Webhook payload validation | Already in project; validate incoming CCBill webhook payloads |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| crypto (Node built-in) | N/A | Webhook signature verification | Verify CCBill webhook authenticity using HMAC/digest |
| @upstash/redis (existing) | 1.36.x | Subscription status cache | Cache active subscription status for fast middleware checks |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CCBill | Segpay | Faster approval (24-72h), similar API, but less ecosystem documentation and fewer community integrations |
| CCBill | Epoch | No rolling reserve (unique advantage), IPSP model (simpler onboarding), but starts at 15% fee rate and has less REST API documentation |
| CCBill | Verotel | Transparent published pricing, EU-regulated, but 15.5% base rate and 10% rolling reserve for 6 months |
| FlexForms (redirect) | Advanced Widget (embedded) | Better UX (no redirect) but significantly more PCI compliance work and implementation complexity |

**Installation:**
```bash
# No new npm packages required for v1 redirect model
# CCBill integration uses:
# - Next.js Route Handlers (webhook endpoint)
# - Server Actions (initiate checkout redirect)
# - Existing Drizzle ORM (subscription schema)
# - Existing Zod (webhook validation)
# - Node.js crypto (webhook signature verification)
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── payment/
│       ├── ccbill-config.ts      # CCBill account config, env vars, constants
│       ├── checkout.ts           # Generate FlexForms checkout URL with signature
│       ├── webhook-handler.ts    # Parse + verify + dispatch CCBill webhook events
│       ├── subscription.ts       # Subscription status queries + cache helpers
│       └── index.ts              # Public API barrel export
├── app/
│   └── api/
│       └── webhooks/
│           └── ccbill/
│               └── route.ts      # POST handler for CCBill webhook events
├── actions/
│   └── payment.ts                # Server action: initiate checkout, check status
└── lib/
    └── db/
        └── schema.ts             # Extended with subscriptions table
```

### Pattern 1: FlexForms Redirect Checkout
**What:** User clicks subscribe -> server generates signed CCBill FlexForms URL -> browser redirects to CCBill-hosted payment page -> CCBill handles card collection -> user redirected back to success/failure URL
**When to use:** Every new subscription purchase
**Example:**
```typescript
// Source: CCBill FlexForms documentation
// Server action to generate checkout URL
"use server";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const CCBILL_FLEXFORMS_URL = "https://api.ccbill.com/wap-frontflex/flexforms";

export async function initiateCheckout() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  // FlexForms URL includes form ID, pricing config, and return URLs
  const checkoutUrl = new URL(CCBILL_FLEXFORMS_URL);
  checkoutUrl.searchParams.set("formName", env.CCBILL_FLEXFORM_ID);
  checkoutUrl.searchParams.set("clientAccnum", env.CCBILL_ACCOUNT_NUMBER);
  checkoutUrl.searchParams.set("clientSubacc", env.CCBILL_SUBACCOUNT);
  // Pass user ID as custom field for webhook correlation
  checkoutUrl.searchParams.set("custom1", session.user.id);

  redirect(checkoutUrl.toString());
}
```

### Pattern 2: Webhook-Driven Subscription State
**What:** CCBill sends POST to our webhook endpoint for every payment event (sale, renewal, cancellation, chargeback) -> we update subscription state in PostgreSQL
**When to use:** All subscription lifecycle events
**Example:**
```typescript
// Source: CCBill webhook documentation
// app/api/webhooks/ccbill/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Verify webhook authenticity (CCBill signature or IP allowlist)
  if (!verifyWebhookSignature(body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const eventType = body.eventType;
  const userId = body.custom1; // Our user ID passed during checkout

  switch (eventType) {
    case "NewSaleSuccess":
      await activateSubscription(userId, body);
      break;
    case "RenewalSuccess":
      await renewSubscription(userId, body);
      break;
    case "Cancellation":
    case "Expiration":
      await deactivateSubscription(userId, body);
      break;
    case "Chargeback":
    case "Refund":
      await handleDispute(userId, body);
      break;
  }

  return NextResponse.json({ status: "ok" });
}
```

### Pattern 3: Subscription-Gated Access via Middleware
**What:** Extend existing proxy.ts middleware to check subscription status before allowing session access
**When to use:** Every request to /session/* routes
**Example:**
```typescript
// Extend existing proxy.ts pattern
const subscriptionActive = request.cookies.get("subscription-active");

if (isSessionRoute && sessionCookie && !subscriptionActive) {
  return NextResponse.redirect(new URL("/subscribe", request.url));
}
```

### Anti-Patterns to Avoid
- **Storing card data anywhere:** Never collect, transmit, or store card numbers. FlexForms redirect model ensures card data never touches our server.
- **Trusting client-side subscription status:** Always verify subscription server-side via database; cookies are optimistic cache only (same pattern as consent-complete cookie).
- **Polling CCBill for status:** Use webhooks (push), never poll. CCBill rate-limits API calls.
- **Synchronous webhook processing:** Return 200 immediately, process asynchronously if heavy work needed. CCBill has a 30-second timeout on webhook responses.
- **Hardcoding CCBill credentials:** Use environment variables exclusively (extend env.ts schema).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Payment form UI | Custom card input fields | CCBill FlexForms hosted page | PCI compliance, fraud detection, 3DS handling all included |
| Subscription billing logic | Custom recurring charge scheduler | CCBill recurring billing engine | Retry logic, dunning, card update handling are complex edge cases |
| Webhook signature verification | Custom HMAC implementation | Follow CCBill's documented verification method | Security-critical; use their exact specification |
| Chargeback handling | Custom dispute resolution flow | CCBill's built-in chargeback management | Card network rules are complex; CCBill handles representment |
| Payment page styling | Custom checkout design | CCBill FlexForms customization (drag-and-drop) | Responsive, multi-currency, multi-language built-in |

**Key insight:** Payment processing has decades of edge cases (expired cards, bank declines, 3DS challenges, currency conversion, fraud detection, chargebacks). Every one of these is handled by CCBill's infrastructure. Building any of this custom would be a months-long project with significant compliance risk.

## Common Pitfalls

### Pitfall 1: Webhook Endpoint Not Publicly Accessible
**What goes wrong:** CCBill webhooks fail silently because the endpoint is behind authentication or not deployed to a public URL
**Why it happens:** Next.js auth middleware intercepts the webhook POST request, or local development uses localhost
**How to avoid:** Exclude `/api/webhooks/ccbill` from auth middleware in proxy.ts; use ngrok or similar for local testing; verify webhook delivery in CCBill admin panel
**Warning signs:** Payments succeed on CCBill side but subscription never activates in your database

### Pitfall 2: Race Condition Between Redirect and Webhook
**What goes wrong:** User returns to success page before webhook has been processed, sees "not subscribed" state
**Why it happens:** Browser redirect happens faster than CCBill's webhook POST to your server
**How to avoid:** On success return page, show "Processing payment..." and poll/wait for subscription activation; or optimistically show success and let webhook confirm
**Warning signs:** Users report paying but not getting access; intermittent "not subscribed" on success page

### Pitfall 3: Missing Webhook Event Types
**What goes wrong:** Only handle NewSaleSuccess, miss Cancellation/Chargeback/Refund events, users keep access after cancelling
**Why it happens:** Developer only tests the happy path
**How to avoid:** Handle ALL event types: NewSaleSuccess, NewSaleFailure, RenewalSuccess, RenewalFailure, Cancellation, Expiration, Chargeback, Refund, Void
**Warning signs:** Users who cancel or dispute still have active subscriptions

### Pitfall 4: Not Correlating Webhook to User
**What goes wrong:** Webhook arrives but you can't match it to the correct user in your database
**Why it happens:** Forgot to pass userId in custom1 field during checkout initiation
**How to avoid:** Always pass user ID as `custom1` parameter when generating FlexForms URL; verify it arrives in webhook payload
**Warning signs:** Webhook processing errors about null/undefined userId

### Pitfall 5: Webhook Timeout Causing Refunds (Verotel-specific, informational)
**What goes wrong:** Verotel auto-refunds if webhook doesn't return "OK" within 30 seconds
**Why it happens:** Heavy processing in webhook handler blocks response
**How to avoid:** Return response immediately, process event asynchronously if needed
**Warning signs:** Successful payments being automatically refunded

### Pitfall 6: CCBill Account Approval Delay
**What goes wrong:** Development blocked waiting for CCBill merchant account approval
**Why it happens:** High-risk account applications require documentation review (typically 72 hours to 7 days)
**How to avoid:** Apply for CCBill account ASAP, in parallel with development; build integration against test/sandbox environment
**Warning signs:** No merchant credentials available when development reaches payment integration

## Code Examples

Verified patterns from project codebase and CCBill documentation:

### Database Schema Extension
```typescript
// Source: Project pattern from src/lib/db/schema.ts + CCBill webhook fields
import { pgTable, uuid, varchar, timestamp, text, boolean } from "drizzle-orm/pg-core";

export const subscriptionsTable = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  // CCBill identifiers for correlation
  ccbillSubscriptionId: varchar("ccbill_subscription_id", { length: 255 }).unique(),
  ccbillTransactionId: varchar("ccbill_transaction_id", { length: 255 }),
  // Subscription state
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  // Values: "pending", "active", "cancelled", "expired", "suspended"
  // Billing metadata
  currentPeriodStart: timestamp("current_period_start", { mode: "date" }),
  currentPeriodEnd: timestamp("current_period_end", { mode: "date" }),
  cancelledAt: timestamp("cancelled_at", { mode: "date" }),
  // Timestamps
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// Immutable payment event log (audit trail)
export const paymentEventsTable = pgTable("payment_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  // Values: "NewSaleSuccess", "RenewalSuccess", "Cancellation", etc.
  ccbillTransactionId: varchar("ccbill_transaction_id", { length: 255 }),
  payload: text("payload"), // Full webhook JSON for audit
  processedAt: timestamp("processed_at", { mode: "date" }).defaultNow().notNull(),
});
```

### Environment Variables Extension
```typescript
// Source: Project pattern from src/lib/env.ts
// Add to envSchema:
CCBILL_ACCOUNT_NUMBER: z.string().min(1),
CCBILL_SUBACCOUNT: z.string().min(1),
CCBILL_FLEXFORM_ID: z.string().min(1),
CCBILL_SALT: z.string().min(1), // For webhook verification
CCBILL_SUCCESS_URL: z.string().url(),
CCBILL_FAILURE_URL: z.string().url(),
```

### Webhook Payload Validation with Zod
```typescript
// Source: CCBill webhook documentation + project Zod pattern
import { z } from "zod";

const ccbillWebhookSchema = z.object({
  eventType: z.enum([
    "NewSaleSuccess", "NewSaleFailure",
    "RenewalSuccess", "RenewalFailure",
    "Cancellation", "Expiration",
    "Chargeback", "Refund", "Void",
    "UpSaleSuccess", "UpSaleFailure",
    "UserReactivation", "BillingDateChange",
  ]),
  subscriptionId: z.string().optional(),
  transactionId: z.string().optional(),
  custom1: z.string(), // Our userId
  timestamp: z.string().optional(),
  clientAccnum: z.string().optional(),
  clientSubacc: z.string().optional(),
}).passthrough(); // Allow additional CCBill fields
```

### Subscription Check Helper
```typescript
// Source: Project pattern matching consent/checks.ts
import { db } from "@/lib/db";
import { subscriptionsTable } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(
      and(
        eq(subscriptionsTable.userId, userId),
        eq(subscriptionsTable.status, "active")
      )
    )
    .limit(1);

  return !!sub;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CCBill legacy postback (URL query params) | CCBill JSON webhooks | ~2022 | Structured JSON payloads; subscribe to all event types vs. only approve/deny |
| CCBill FlexForms only | CCBill RESTful API + Advanced Widget | ~2021 | Embedded payment forms possible (but FlexForms still recommended for simpler PCI scope) |
| Rolling reserve standard everywhere | Epoch offers zero rolling reserve | Current | Cost advantage for Epoch; CCBill and Segpay still require 5-10% reserve |
| PCI DSS v3.2.1 | PCI DSS v4.0 | March 2024 | Stricter requirements for any cardholder data handling; stronger reason to use hosted payment pages |

**Deprecated/outdated:**
- CCBill XML postback format: Still supported but JSON webhooks preferred; JSON format selected in CCBill admin panel
- Direct card collection: PCI DSS v4.0 makes self-hosted payment forms significantly more burdensome; use hosted pages or tokenization widgets

## Open Questions

1. **CCBill Sandbox/Test Environment**
   - What we know: CCBill provides test accounts and sandbox credentials for development
   - What's unclear: Exact sandbox URLs, test card numbers, and whether webhook testing is supported in sandbox
   - Recommendation: Apply for merchant account early; request sandbox credentials during application; use ngrok for local webhook testing

2. **Subscription Pricing Model**
   - What we know: CCBill supports one-time purchases and recurring subscriptions with configurable periods
   - What's unclear: What the product's subscription pricing will be (monthly? annual? one-time access?)
   - Recommendation: Start with simple monthly recurring subscription; CCBill FlexForms pricing is configured in their admin panel, not in code

3. **CCBill Fees for This Business Model**
   - What we know: CCBill rates range from 3.9% + $0.55 (standard) to 10.8-14.5% (high-risk); adult wellness likely falls in 5.9-10.8% range
   - What's unclear: Exact rate until merchant application is approved
   - Recommendation: Budget for ~10% transaction fee; negotiate after establishing volume

4. **Webhook Signature Verification Method**
   - What we know: CCBill webhooks can be verified; the admin panel configures a salt/key
   - What's unclear: Exact signature algorithm (HMAC-SHA256? MD5 digest?) for JSON webhooks vs. legacy postback
   - Recommendation: Consult CCBill documentation during implementation; implement IP allowlist as secondary verification

5. **Free Trial / Grace Period Handling**
   - What we know: CCBill supports trial periods as part of FlexForms pricing configuration
   - What's unclear: Whether to offer a free trial for v1
   - Recommendation: Skip free trial for v1; implement simple binary active/inactive subscription state

## Sources

### Primary (HIGH confidence)
- [CCBill RESTful API Guide (GitHub)](https://github.com/CCBill/restful-api-guide) - OAuth flow, payment tokenization, transaction endpoints, OpenAPI spec
- [CCBill RESTful API README](https://github.com/CCBill/restful-api-guide/blob/main/README.md) - Complete integration flow: widget setup, token creation, charge execution

### Secondary (MEDIUM confidence)
- [7 Best Payment Gateways for Adult Sites (ATLOS)](https://atlos.io/blog/best-payment-gateways-for-adult-sites) - Comprehensive comparison of CCBill, Segpay, Epoch, Verotel with pricing and feature analysis
- [Segpay Processing API](https://gethelp.segpay.com/docs/Content/DeveloperDocs/ProcessingAPI/Home-ProcessingAPI.htm) - Segpay developer documentation hub
- [CCBill Merchant Knowledge Base - Webhooks](https://dev2.cwie.net/doc/webhooks-overview) - Webhook event types, JSON format configuration, postback vs. webhook differences
- [Verotel FlexPay API v3.2](https://radekpetr.gitbooks.io/flexpay-api-v3-2-purchase/content/technical_details/) - Complete redirect-based payment flow documentation
- [CCBill Review - Merchant Maverick](https://www.merchantmaverick.com/reviews/ccbill-review/) - Approval timeline (72 hours to 7 days), fee structure
- [Epoch Pricing (Merchant Machine)](https://merchantmachine.co.uk/high-risk/epoch/) - 15% starting rate, no rolling reserve, $1,450 annual card brand fee
- [Verotel Pricing (Merchant Alternatives)](https://merchantalternatives.com/reviews/verotel/) - 15.5% base, 10% rolling reserve, transparent pricing

### Tertiary (LOW confidence)
- [ccbill npm package (Snyk)](https://snyk.io/advisor/npm-package/ccbill) - Unmaintained; last update >12 months ago; not recommended for production
- [ccbill-restful-api npm package (Socket)](https://socket.dev/npm/package/ccbill-restful-api) - Unofficial TS wrapper; last update >12 months; not recommended

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - CCBill is clearly the industry standard but has less open documentation than mainstream processors like Stripe; no official Node.js SDK
- Architecture: HIGH - Redirect-based payment + webhook pattern is well-established and matches project's existing patterns (consent cookie + server verification)
- Pitfalls: HIGH - Well-documented across community integrations and multiple sources; webhook timing and PCI scope issues are universally acknowledged

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (30 days - payment processor APIs are stable; pricing may change)
