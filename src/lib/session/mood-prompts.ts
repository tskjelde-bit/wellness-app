/**
 * Mood-to-prompt mapping for 5 mood states.
 *
 * Each mood produces a short (3-5 line) prompt modifier that is injected
 * into phase instructions BEFORE the CURRENT PHASE line. This keeps
 * phase-specific instructions as the most-recent/salient context
 * (Research Pitfall 5: prompt ordering).
 *
 * Structure follows MOOD CONTEXT / EMPHASIS / TONE SHIFT pattern.
 */

// ---------------------------------------------------------------------------
// Mood options (used by client UI for selection)
// ---------------------------------------------------------------------------

export interface MoodOption {
  id: string;
  label: string;
  emoji: string;
}

export const MOOD_OPTIONS: readonly MoodOption[] = [
  { id: "anxious", label: "Anxious", emoji: "\u{1F630}" },
  { id: "sad", label: "Sad", emoji: "\u{1F622}" },
  { id: "stressed", label: "Stressed", emoji: "\u{1F62B}" },
  { id: "neutral", label: "Neutral", emoji: "\u{1F60C}" },
  { id: "restless", label: "Restless", emoji: "\u{1F4AD}" },
] as const;

// ---------------------------------------------------------------------------
// Mood prompt modifiers
// ---------------------------------------------------------------------------

export const MOOD_PROMPTS: Record<string, string> = {
  anxious: `MOOD CONTEXT: The listener is feeling anxious. Their mind may be racing with worry or apprehension.
EMPHASIS: Extra grounding cues -- focus on what is solid, present, and safe. Use anchoring phrases like "right here, right now."
TONE SHIFT: Slower pacing, shorter sentences. Prioritize breath awareness and physical grounding over abstract imagery.`,

  sad: `MOOD CONTEXT: The listener is feeling sad. They may carry heaviness or emotional fatigue.
EMPHASIS: Gentle acknowledgment without trying to fix. Warmth and compassion over cheerfulness. Hold space for whatever they feel.
TONE SHIFT: Softer language, tender imagery. Emphasize comfort, being held, and the permission to simply rest.`,

  stressed: `MOOD CONTEXT: The listener is feeling stressed. Their body may hold tension and their thoughts may feel scattered.
EMPHASIS: Progressive tension release -- draw attention to where stress lives in the body (jaw, shoulders, chest) and guide softening.
TONE SHIFT: Measured, unhurried rhythm. Use exhale-focused cues and imagery of weight lifting, loosening, melting away.`,

  neutral: `Standard session flow -- balanced across all phases.
TONE SHIFT: None.`,

  restless: `MOOD CONTEXT: The listener is feeling restless. They may struggle to settle in or feel fidgety and unfocused.
EMPHASIS: Movement-to-stillness transitions. Acknowledge restless energy without judgment, then channel it toward body awareness.
TONE SHIFT: Start with slightly more active language, then gradually slow. Use curiosity-based prompts: "notice what happens when..."`,
};
