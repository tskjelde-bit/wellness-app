/**
 * POST /api/session/complete
 *
 * Cleans up a finished session by deleting its state from Redis.
 * Replaces the WebSocket session_end / close cleanup logic.
 *
 * Request body: { sessionId: string }
 * Response: { ok: true }
 */

import { NextResponse } from "next/server";
import { deleteSessionState } from "@/lib/session-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { sessionId } = body;

    if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
      return NextResponse.json(
        { error: "sessionId must be a non-empty string" },
        { status: 400 },
      );
    }

    await deleteSessionState(sessionId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/session/complete] Error:", error);
    return NextResponse.json(
      { error: "Failed to complete session" },
      { status: 500 },
    );
  }
}
