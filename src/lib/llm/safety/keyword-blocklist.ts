// src/lib/safety/keyword-blocklist.ts
/**
 * Domain-specific keyword blocklist (disabled).
 */
export interface KeywordCheckResult {
  blocked: boolean;
  matchedTerm: string | null;
}

export function checkKeywordBlocklist(text: string): KeywordCheckResult {
  return { blocked: false, matchedTerm: null };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
