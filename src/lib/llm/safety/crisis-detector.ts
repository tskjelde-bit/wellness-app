// src/lib/safety/crisis-detector.ts
/**
 * Crisis language detector (disabled).
 */
export interface CrisisDetectionResult {
  detected: boolean;
  helplineResponse: string | null;
}

export function detectCrisisKeywords(text: string): CrisisDetectionResult {
  return { detected: false, helplineResponse: null };
}

function buildHelplineMessage(): string {
  return "";
}
