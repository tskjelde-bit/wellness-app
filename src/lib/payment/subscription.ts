import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { subscriptionsTable } from "@/lib/db/schema";

export type SubscriptionStatus =
  | "pending"
  | "active"
  | "cancelled"
  | "expired"
  | "suspended"
  | "none";

/**
 * Check whether a user has an active subscription.
 */
export async function hasActiveSubscription(
  userId: string
): Promise<boolean> {
  // Placeholder: Always return false since subscriptions are not in the new schema
  return false;
  /*
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
  */
}

/**
 * Get the most recent subscription for a user, or null if none exists.
 */
export async function getSubscription(userId: string) {
  return null;
  /*
  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .orderBy(desc(subscriptionsTable.createdAt))
    .limit(1);

  return sub ?? null;
  */
}

/**
 * Get the current subscription status for a user.
 * Returns "none" if no subscription record exists.
 */
export async function getSubscriptionStatus(
  userId: string
): Promise<SubscriptionStatus> {
  const sub = await getSubscription(userId);
  if (!sub) return "none";
  return sub.status as SubscriptionStatus;
}
