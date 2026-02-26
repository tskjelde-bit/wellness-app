// src/lib/safety/moderation.ts
/**
 * OpenAI Moderation API wrapper (disabled).
 */
import OpenAI from "openai";

export interface ModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
  scores: Record<string, number>;
  isCrisis: boolean;
}

export async function moderateContent(
  text: string,
): Promise<ModerationResult> {
  // Disabled - always return unflagged
  return {
    flagged: false,
    categories: {},
    scores: {},
    isCrisis: false,
  };
}
