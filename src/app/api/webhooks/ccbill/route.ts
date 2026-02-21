import { NextRequest, NextResponse } from "next/server";
import { handleWebhookEvent } from "@/lib/payment";

/**
 * CCBill Webhook Endpoint
 *
 * Receives POST events from CCBill for payment lifecycle events
 * (sales, renewals, cancellations, chargebacks, refunds).
 *
 * This endpoint does NOT require authentication -- CCBill posts
 * to it directly. The webhook handler internally verifies authenticity.
 */
export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const result = await handleWebhookEvent(body);

    if (result.success) {
      return NextResponse.json({ status: "ok" }, { status: 200 });
    }

    return NextResponse.json({ error: result.error }, { status: 400 });
  } catch {
    // Never leak internals in error responses
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
