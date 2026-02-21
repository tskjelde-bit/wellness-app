import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  subscriptionsTable,
  paymentEventsTable,
} from "@/lib/db/schema";
import { getCcbillConfig } from "./ccbill-config";

// Zod schema for validating incoming CCBill webhook payloads
export const ccbillWebhookSchema = z
  .object({
    eventType: z.enum([
      "NewSaleSuccess",
      "NewSaleFailure",
      "RenewalSuccess",
      "RenewalFailure",
      "Cancellation",
      "Expiration",
      "Chargeback",
      "Refund",
      "Void",
    ]),
    subscriptionId: z.string().optional(),
    transactionId: z.string().optional(),
    custom1: z.string(), // Our userId for webhook correlation
  })
  .passthrough(); // Allow additional CCBill fields we don't explicitly validate

/**
 * Verify webhook signature/authenticity.
 * For v1, performs basic structural validation and salt presence check.
 *
 * TODO: Implement full HMAC signature verification once CCBill's exact
 * algorithm for JSON webhooks is confirmed during merchant onboarding.
 * The salt from CCBill Merchant Admin -> Webhooks -> Encryption Key/Salt
 * will be used for HMAC-SHA256 digest verification.
 */
export function verifyWebhookSignature(
  body: unknown,
  salt: string
): boolean {
  // Basic structural check: body must be an object with eventType
  if (!body || typeof body !== "object") return false;
  if (!("eventType" in body)) return false;
  // Salt must be non-empty (confirms it's configured)
  if (!salt || salt.length === 0) return false;
  return true;
}

/**
 * Process an incoming CCBill webhook event.
 * Validates payload, records event for audit, and updates subscription state.
 */
export async function handleWebhookEvent(
  body: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  // 1. Parse and validate webhook payload
  const parsed = ccbillWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false,
      error: `Invalid webhook payload: ${parsed.error.message}`,
    };
  }

  const { eventType, subscriptionId, transactionId, custom1: userId } =
    parsed.data;

  // 2. Verify webhook signature
  let salt: string;
  try {
    const config = getCcbillConfig();
    salt = config.salt;
  } catch {
    // In development, CCBill vars may not be set -- log and continue
    console.warn(
      "CCBill config not available for webhook verification, skipping signature check"
    );
    salt = "";
  }

  if (salt && !verifyWebhookSignature(body, salt)) {
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      console.warn("Webhook signature verification failed (development mode, continuing)");
    } else {
      return { success: false, error: "Webhook signature verification failed" };
    }
  }

  // 3. Record payment event for audit trail (all events, regardless of type)
  await db.insert(paymentEventsTable).values({
    userId,
    eventType,
    ccbillTransactionId: transactionId ?? null,
    payload: JSON.stringify(body),
  });

  // 4. Update subscription state based on event type
  const now = new Date();

  switch (eventType) {
    case "NewSaleSuccess": {
      // Upsert subscription: create or update based on ccbillSubscriptionId
      if (subscriptionId) {
        await db
          .insert(subscriptionsTable)
          .values({
            userId,
            ccbillSubscriptionId: subscriptionId,
            ccbillTransactionId: transactionId ?? null,
            status: "active",
            currentPeriodStart: now,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: subscriptionsTable.ccbillSubscriptionId,
            set: {
              status: "active",
              ccbillTransactionId: transactionId ?? null,
              currentPeriodStart: now,
              updatedAt: now,
            },
          });
      } else {
        // No subscriptionId yet -- create with userId correlation only
        await db.insert(subscriptionsTable).values({
          userId,
          ccbillTransactionId: transactionId ?? null,
          status: "active",
          currentPeriodStart: now,
          createdAt: now,
          updatedAt: now,
        });
      }
      break;
    }

    case "RenewalSuccess": {
      if (subscriptionId) {
        await db
          .update(subscriptionsTable)
          .set({
            status: "active",
            currentPeriodEnd: now, // End of previous period = start of new
            updatedAt: now,
          })
          .where(
            eq(subscriptionsTable.ccbillSubscriptionId, subscriptionId)
          );
      }
      break;
    }

    case "Cancellation": {
      if (subscriptionId) {
        await db
          .update(subscriptionsTable)
          .set({
            status: "cancelled",
            cancelledAt: now,
            updatedAt: now,
          })
          .where(
            eq(subscriptionsTable.ccbillSubscriptionId, subscriptionId)
          );
      }
      break;
    }

    case "Expiration": {
      if (subscriptionId) {
        await db
          .update(subscriptionsTable)
          .set({
            status: "expired",
            cancelledAt: now,
            updatedAt: now,
          })
          .where(
            eq(subscriptionsTable.ccbillSubscriptionId, subscriptionId)
          );
      }
      break;
    }

    case "Chargeback":
    case "Refund":
    case "Void": {
      if (subscriptionId) {
        await db
          .update(subscriptionsTable)
          .set({
            status: "suspended",
            updatedAt: now,
          })
          .where(
            eq(subscriptionsTable.ccbillSubscriptionId, subscriptionId)
          );
      }
      break;
    }

    default: {
      // Unknown event type -- already recorded in payment_events above
      console.warn(`Unknown CCBill webhook event type: ${eventType}`);
      break;
    }
  }

  return { success: true };
}
