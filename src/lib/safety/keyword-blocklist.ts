/**
 * Domain-specific keyword blocklist (Layer 3 of three-layer safety filter).
 *
 * Catches terms that the OpenAI Moderation API might miss because they are
 * domain-adjacent to wellness content but cross the product's content boundary.
 * Uses word-boundary regex matching to avoid false positives.
 */

import { KEYWORD_BLOCKLIST } from "./constants";

export interface KeywordCheckResult {
  blocked: boolean;
  matchedTerm: string | null;
}

/**
 * Check text against the domain-specific keyword blocklist.
 * Returns on first match for efficiency.
 */
export function checkKeywordBlocklist(text: string): KeywordCheckResult {
  const lower = text.toLowerCase();

  for (const term of KEYWORD_BLOCKLIST) {
    const regex = new RegExp(`\\b${escapeRegex(term)}\\b`, "i");
    if (regex.test(lower)) {
      return { blocked: true, matchedTerm: term };
    }
  }

  return { blocked: false, matchedTerm: null };
}

/**
 * Escape special regex characters in a string to use it as a literal pattern.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
