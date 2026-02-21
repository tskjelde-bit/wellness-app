import { redis } from "@/lib/redis";
import type { SessionPhase } from "@/lib/session/phase-machine";

export const SESSION_TTL = 3600; // 1 hour in seconds

export interface SessionState {
  userId: string;
  createdAt: number;
  // Phase 2 consent flags (ephemeral Redis cache -- PostgreSQL is source of truth)
  ageVerified: boolean;
  tosAccepted: boolean;
  sensoryConsentGiven: boolean;
  aiDisclosureShown: boolean;
  // Phase 5 orchestration state (all optional for backward compatibility)
  /** Current phase in the session FSM */
  currentPhase?: SessionPhase;
  /** Timestamp when current phase began */
  phaseStartedAt?: number;
  /** Sentence counter within current phase */
  sentencesInPhase?: number;
  /** Cumulative sentence count across all phases */
  totalSentences?: number;
  /** OpenAI response ID for context chaining (null when not yet set) */
  previousResponseId?: string | null;
  /** Sentence budgets per phase (from getSessionBudgets) */
  phaseBudgets?: Record<SessionPhase, number>;
  /** Selected character for the session */
  character?: "Thea" | "Mari" | "Milfen";
  /** Session length in minutes (10, 15, 20, or 30) */
  sessionLengthMinutes?: number;
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
