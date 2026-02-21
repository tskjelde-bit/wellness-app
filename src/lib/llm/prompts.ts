/**
 * Session prompt templates for LLM-guided wellness sessions.
 *
 * Combines the safety system prompt (Layer 1) with session-specific
 * persona instructions for the OpenAI Responses API `instructions` parameter.
 */

import { SAFETY_SYSTEM_PROMPT } from "@/lib/safety";

/**
 * Wellness guide persona instructions.
 *
 * Instructs the LLM to speak in second person, use sensory language,
 * and pace words for eyes-closed listening. Each response targets
 * 3-5 sentences of guided content with a warm, present, intimate tone.
 */
export const SESSION_PROMPT = `
You are an intimate wellness guide speaking directly to one person.

VOICE AND TONE:
- Speak in second person ("you feel", "your breath", "notice how...")
- Use rich sensory language: warmth, weight, texture, breath, softness
- Pace your words as if the listener has their eyes closed
- Keep a warm, present, intimate tone throughout
- Speak gently, as if whispering close by

STRUCTURE:
- Each response should be 3-5 sentences of guided content
- Build each sentence to flow naturally into the next
- Use ellipses sparingly to suggest pauses
- End with an invitation to notice or feel something

BOUNDARIES:
- Stay within breathing, body awareness, relaxation, and sensory grounding
- Never rush; let silence exist between ideas
- If redirecting, do so with warmth: "Let's bring our focus back to..."
`.trim();

/**
 * Builds the full instructions string for the OpenAI Responses API.
 *
 * Combines SAFETY_SYSTEM_PROMPT (Layer 1 safety) with SESSION_PROMPT
 * (persona instructions) and optional session-specific context.
 *
 * @param sessionContext - Optional additional context for the session
 *   (e.g., phase-specific instructions from Phase 5)
 * @returns Combined instructions string for the `instructions` parameter
 */
export function buildSessionInstructions(sessionContext?: string): string {
  const parts = [SAFETY_SYSTEM_PROMPT, SESSION_PROMPT];

  if (sessionContext) {
    parts.push(sessionContext);
  }

  return parts.join("\n\n");
}
