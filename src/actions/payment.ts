"use server";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { generateCheckoutUrl, getSubscriptionStatus } from "@/lib/payment";

/**
 * Initiate CCBill checkout flow.
 * Generates a checkout URL and redirects the user to CCBill's payment page.
 */
export async function initiateCheckout() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const headersList = await headers();
  const proto = headersList.get("x-forwarded-proto") || "https";
  const host = headersList.get("host");
  const origin =
    proto && host
      ? `${proto}://${host}`
      : process.env.AUTH_URL || "http://localhost:3000";

  const checkoutUrl = generateCheckoutUrl(session.user.id, origin);

  redirect(checkoutUrl);
}

/**
 * Check the current user's subscription status.
 * If active, sets subscription-active cookie to enable proxy.ts optimistic check.
 */
export async function checkSubscriptionStatus(): Promise<{
  status: "pending" | "active" | "cancelled" | "expired" | "suspended" | "none";
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { status: "none" as const };
  }

  const status = await getSubscriptionStatus(session.user.id);

  if (status === "active") {
    const cookieStore = await cookies();
    cookieStore.set("subscription-active", "1", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 86400, // 24 hours
      sameSite: "lax",
    });
  }

  return { status };
}
