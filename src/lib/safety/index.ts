/**
 * Three-layer content safety filter -- main entry point.
 *
 * Layer 1: System prompt (SAFETY_SYSTEM_PROMPT) -- applied upstream at LLM call
 *          time. Exported here for convenience but not invoked by this function.
 * Layer 2: OpenAI Moderation API (moderateContent) -- classifies each sentence.
 * Layer 3: Keyword blocklist (checkKeywordBlocklist) -- catches domain-specific terms.
 *
 * Crisis detection runs FIRST as the highest priority check, before moderation
 * or keyword filtering.
 *
 * CRITICAL: The `output` field of SafetyCheckResult ALWAYS contains a non-empty
 * string. Downstream consumers (TTS in Phase 4) can rely on this invariant.
 */

import { moderateContent, type ModerationResult } from "./moderation";
import { checkKeywordBlocklist } from "./keyword-blocklist";
import { detectCrisisKeywords } from "./crisis-detector";
import { getRandomFallback } from "./constants";

export interface SafetyCheckResult {
  safe: boolean;
  original: string;
  /** ALWAYS a non-empty string: original text if safe, fallback/helpline if blocked */
  output: string;
  moderationResult: ModerationResult | null;
  crisisDetected: boolean;
  blockedBy: "none" | "moderation" | "keyword" | "crisis";
}

export async function checkContentSafety(
  text: string,
): Promise<SafetyCheckResult> {
  // -----------------------------------------------------------------------
  // Step 1: Crisis detection (highest priority -- checked first)
  // -----------------------------------------------------------------------
  const crisisResult = detectCrisisKeywords(text);
  if (crisisResult.detected) {
    return {
      safe: false,
      original: text,
      output: crisisResult.helplineResponse!,
      moderationResult: null,
      crisisDetected: true,
      blockedBy: "crisis",
    };
  }

  // -----------------------------------------------------------------------
  // Step 2: OpenAI Moderation API (Layer 2)
  // -----------------------------------------------------------------------
  const moderationResult = await moderateContent(text);

  // Moderation-detected crisis (self-harm categories)
  if (moderationResult.isCrisis) {
    // Build helpline message for moderation-detected crisis
    const crisisFallback = detectCrisisKeywords(
      "suicide",
    ).helplineResponse!;
    return {
      safe: false,
      original: text,
      output: crisisFallback,
      moderationResult,
      crisisDetected: true,
      blockedBy: "crisis",
    };
  }

  // Non-crisis moderation flag
  if (moderationResult.flagged) {
    return {
      safe: false,
      original: text,
      output: getRandomFallback(),
      moderationResult,
      crisisDetected: false,
      blockedBy: "moderation",
    };
  }

  // -----------------------------------------------------------------------
  // Step 3: Keyword blocklist (Layer 3)
  // -----------------------------------------------------------------------
  const keywordResult = checkKeywordBlocklist(text);
  if (keywordResult.blocked) {
    return {
      safe: false,
      original: text,
      output: getRandomFallback(),
      moderationResult,
      crisisDetected: false,
      blockedBy: "keyword",
    };
  }

  // -----------------------------------------------------------------------
  // Step 4: Content is safe
  // -----------------------------------------------------------------------
  return {
    safe: true,
    original: text,
    output: text,
    moderationResult,
    crisisDetected: false,
    blockedBy: "none",
  };
}

// Re-export key types and sub-modules for barrel import convenience
export { moderateContent, type ModerationResult } from "./moderation";
export {
  checkKeywordBlocklist,
  type KeywordCheckResult,
} from "./keyword-blocklist";
export {
  detectCrisisKeywords,
  type CrisisDetectionResult,
} from "./crisis-detector";
export { SAFETY_SYSTEM_PROMPT } from "./system-prompt-safety";
export { SAFETY_FALLBACKS, getRandomFallback } from "./constants";
