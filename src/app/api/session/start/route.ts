/**
 * POST /api/session/start
 *
 * Creates a new session in Redis and returns the session ID with phase budgets.
 * Replaces the WebSocket session_start event for Vercel-compatible deployments.
 */

import { NextResponse } from "next/server";
import { setSessionState } from "@/lib/session-store";
import { getSessionBudgets } from "@/lib/session/phase-config";

const VALID_SESSION_LENGTHS = [10, 15, 20, 30] as const;
const VALID_CHARACTERS = ["Thea", "Mari", "Milfen"] as const;

type ValidCharacter = (typeof VALID_CHARACTERS)[number];

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      character,
      voice,
      mood,
      sessionLength,
      soundscape,
      sensoryConsent,
    } = body;

    // Validate and default session length
    const length =
      typeof sessionLength === "number" &&
      VALID_SESSION_LENGTHS.includes(sessionLength as typeof VALID_SESSION_LENGTHS[number])
        ? sessionLength
        : 15;

    // Validate character
    const validatedCharacter: ValidCharacter | undefined =
      typeof character === "string" &&
      VALID_CHARACTERS.includes(character as ValidCharacter)
        ? (character as ValidCharacter)
        : undefined;

    const sessionId = crypto.randomUUID();
    const phaseConfig = getSessionBudgets(length);

    // Persist session state in Redis
    await setSessionState(sessionId, {
      userId: "", // TODO: extract from auth when auth is enforced
      createdAt: Date.now(),
      ageVerified: true,
      tosAccepted: true,
      sensoryConsentGiven: !!sensoryConsent,
      aiDisclosureShown: true,
      currentPhase: "atmosphere",
      phaseStartedAt: Date.now(),
      sentencesInPhase: 0,
      totalSentences: 0,
      previousResponseId: null,
      phaseBudgets: Object.fromEntries(
        Object.entries(phaseConfig).map(([phase, config]) => [
          phase,
          config.sentenceBudget,
        ]),
      ) as Record<string, number> as any,
      character: validatedCharacter,
      sessionLengthMinutes: length,
    });

    return NextResponse.json({ sessionId, phaseConfig });
  } catch (error) {
    console.error("[api/session/start] Error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 },
    );
  }
}
