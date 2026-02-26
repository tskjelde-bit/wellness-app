// src/lib/safety/constants.ts
/**
 * Safety constants: all restrictions removed.
 */

// Empty helpline resources
export const HELPLINE_RESOURCES = {};

// Empty fallbacks
export const SAFETY_FALLBACKS = [] as const;

export function getRandomFallback(): string {
  return "";
}

// Empty keyword blocklist
export const KEYWORD_BLOCKLIST: string[] = [];

// Empty crisis keywords
export const CRISIS_KEYWORDS: string[] = [];
