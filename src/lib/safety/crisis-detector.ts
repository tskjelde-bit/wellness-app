/**
 * Crisis language detector with helpline response generation.
 *
 * Identifies self-harm and distress language via keyword matching and
 * returns a compassionate helpline resource message. This supplements the
 * OpenAI Moderation API's self-harm category detection (which may miss
 * some phrases or have latency).
 */

import { HELPLINE_RESOURCES, CRISIS_KEYWORDS } from "./constants";

export interface CrisisDetectionResult {
  detected: boolean;
  helplineResponse: string | null;
}

/**
 * Detect crisis/self-harm language in text using keyword phrase matching.
 * If detected, returns a helpline resource message referencing 988 Lifeline
 * and SAMHSA.
 */
export function detectCrisisKeywords(text: string): CrisisDetectionResult {
  const lower = text.toLowerCase();
  const detected = CRISIS_KEYWORDS.some((keyword) => lower.includes(keyword));

  if (!detected) {
    return { detected: false, helplineResponse: null };
  }

  return {
    detected: true,
    helplineResponse: buildHelplineMessage(),
  };
}

function buildHelplineMessage(): string {
  const { crisis, samhsa } = HELPLINE_RESOURCES;
  return (
    `I want you to know that you matter, and support is available right now. ` +
    `If you're in crisis, please reach out to the ${crisis.name} by calling or texting ${crisis.phone}, ` +
    `or ${crisis.text}. You can also contact the ${samhsa.name} at ${samhsa.phone}. ` +
    `These services are free, confidential, and available 24/7.`
  );
}
