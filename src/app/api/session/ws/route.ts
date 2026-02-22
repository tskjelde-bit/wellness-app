/**
 * WebSocket route handler for real-time audio sessions.
 *
 * Uses next-ws to handle WebSocket upgrade requests in Next.js App Router.
 * The SOCKET export is called by next-ws when a client upgrades to WebSocket.
 *
 * Authentication: TODO -- auth check deferred to Phase 5/6 (session state
 * machine handles auth context). For now, accept all connections.
 */

import type { WebSocket } from "ws";
import type { NextRequest } from "next/server";
import { handleSession } from "@/lib/ws/session-handler";

/**
 * Handle WebSocket connections.
 *
 * Called by next-ws when a client upgrades to WebSocket at /api/session/ws.
 * Delegates full session lifecycle management to handleSession.
 */
export function UPGRADE(
  client: WebSocket,
  _request: NextRequest,
): void {
  // TODO: Authenticate via session cookie or token from request (Phase 5/6)
  handleSession(client);
}

/**
 * Return 426 Upgrade Required for non-WebSocket HTTP requests.
 */
export function GET() {
  return new Response("WebSocket upgrade required", { status: 426 });
}
