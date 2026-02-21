/**
 * OpenAI Moderation API wrapper (Layer 2 of three-layer safety filter).
 *
 * Uses the omni-moderation-latest model to classify content across 13+
 * categories including self-harm, sexual, and violence. The sexual category
 * uses a custom threshold (0.8) to avoid false positives on legitimate
 * wellness/body-awareness language.
 */

import OpenAI from "openai";

const openai = new OpenAI(); // Reads OPENAI_API_KEY from env automatically

export interface ModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
  scores: Record<string, number>;
  isCrisis: boolean;
}

export async function moderateContent(
  text: string,
): Promise<ModerationResult> {
  const response = await openai.moderations.create({
    model: "omni-moderation-latest",
    input: text,
  });

  const result = response.results[0];

  // Detect crisis: self-harm categories
  const isCrisis =
    result.categories["self-harm"] ||
    result.categories["self-harm/intent"] ||
    result.categories["self-harm/instructions"];

  // Custom flagging logic:
  // - Sexual category: only flag if score >= 0.8 (avoids false positives
  //   on body-awareness / wellness language like "warmth", "touch", "sensation")
  // - All other categories: use the API's default flagged boolean
  const categories = result.categories as unknown as Record<string, boolean>;
  const scores = result.category_scores as unknown as Record<string, number>;

  const sexualScore = scores["sexual"] ?? 0;
  const sexualFlagged = sexualScore >= 0.8;

  // Check if any non-sexual category is flagged by the API
  const nonSexualFlagged = Object.entries(categories).some(
    ([category, isFlagged]) => {
      if (category === "sexual") return false;
      return isFlagged;
    },
  );

  const flagged = nonSexualFlagged || sexualFlagged;

  return {
    flagged,
    categories,
    scores,
    isCrisis,
  };
}
