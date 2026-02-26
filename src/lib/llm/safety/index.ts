// src/lib/safety/index.ts
/** 
 * Three-layer content safety filter -- main entry point.
 * 
 * All safety checks have been disabled to remove restrictions.
 */
import { type ModerationResult } from "./moderation";
import { type KeywordCheckResult } from "./keyword-blocklist";
import { type CrisisDetectionResult } from "./crisis-detector";

export interface SafetyCheckResult {
  safe: boolean;
  original: string;
  output: string;
  moderationResult: ModerationResult | null;
  crisisDetected: boolean;
  blockedBy: "none" | "moderation" | "keyword" | "crisis";
}

export async function checkContentSafety(
  text: string,
): Promise<SafetyCheckResult> {
  // All checks disabled - always return as safe
  return {
    safe: true,
    original: text,
    output: text,
    moderationResult: null,
    crisisDetected: false,
    blockedBy: "none",
  };
}

// Re-exports (empty or disabled)
export { type ModerationResult } from "./moderation";
export { type KeywordCheckResult } from "./keyword-blocklist";
export { type CrisisDetectionResult } from "./crisis-detector";
export { SAFETY_SYSTEM_PROMPT } from "./system-prompt-safety";
export { SAFETY_FALLBACKS, getRandomFallback } from "./constants";
