import { redis } from "@/lib/redis";

export const SESSION_TTL = 3600; // 1 hour in seconds

export interface SessionState {
  userId: string;
  createdAt: number;
}

export async function getSessionState(
  sessionId: string
): Promise<SessionState | null> {
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
