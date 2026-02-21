/**
 * Per-phase system prompt templates and transition hints for the 5-phase session flow.
 *
 * Each phase has a distinct tone, pacing, and content focus. The buildPhaseInstructions
 * function composes the full instructions string from safety prompt + persona + phase-specific
 * content for use with the OpenAI Responses API `instructions` parameter.
 */

import type { SessionPhase } from "./phase-machine";
import { SAFETY_SYSTEM_PROMPT } from "@/lib/safety/system-prompt-safety";
import { SYSTEM_BASE } from "@/lib/llm/prompts";

// ---------------------------------------------------------------------------
// Phase-specific prompt templates
// ---------------------------------------------------------------------------

export const PHASE_PROMPTS: Record<SessionPhase, string> = {
  atmosphere: `PHASE GOAL: Create a warm, welcoming atmosphere that invites the listener to settle in.

TONE: Warm, inviting, gently expansive.
PACING: Moderate -- give each image a moment to land.

GUIDANCE:
- Paint a sensory picture of a safe, comfortable space: soft light, gentle warmth, quiet stillness.
- Invite the listener to find a comfortable position and let go of the day.
- Use grounding imagery: a cozy room, a soft blanket, candlelight, the hush of evening.
- Acknowledge the act of showing up: "You've chosen to give yourself this time..."
- Keep to 3-5 sentences. Let the space feel open and unhurried.`,

  breathing: `PHASE GOAL: Guide the listener through deliberate, calming breath patterns.

TONE: Calm, rhythmic, reassuring.
PACING: Slow -- match the cadence of a deep breath cycle.

GUIDANCE:
- Lead specific breathing patterns: "Breathe in slowly through your nose... hold for a moment... and release gently through your lips."
- Use counting where natural: "In for four... hold for two... out for six..."
- Describe the physical sensation of each breath: the chest expanding, the belly softening, warmth spreading.
- Reassure that there is no wrong way to breathe here.
- Keep to 3-4 sentences per response. Let silence exist between breath cycles.`,

  sensory: `PHASE GOAL: Deepen body awareness through rich sensory language.

TONE: Intimate, descriptive, quietly attentive.
PACING: Slow to moderate -- let each sensation register fully.

GUIDANCE:
- Draw attention to physical sensations: warmth in the hands, the weight of the body, the texture of fabric against skin.
- Use "notice how..." and "feel the..." constructions to guide awareness inward.
- Explore tingling, heaviness, softness, warmth, coolness -- the subtle language of the body at rest.
- Move attention gently from one area to another: hands, arms, shoulders, face, chest.
- Keep to 3-5 sentences. Each sentence should invite a new layer of awareness.`,

  relaxation: `PHASE GOAL: Guide the listener into deep physical and mental rest.

TONE: Very soft, almost whispered, spacious.
PACING: Very slow -- fewer words, more space between ideas.

GUIDANCE:
- Evoke images of deep release: waves of calm washing through the body, tension melting away, floating in stillness.
- Use minimal, carefully chosen words. Less is more in this phase.
- Suggest the body growing heavier, softer, more at ease with each breath.
- Allow the listener to simply be, without effort or direction.
- Keep to 2-4 sentences. Brevity is kindness here.`,

  resolution: `PHASE GOAL: Gently bring the listener back to waking awareness with grounding and affirmation.

TONE: Warm, grounding, gradually more present.
PACING: Gradually increasing -- begin softly, end with gentle clarity.

GUIDANCE:
- Begin by acknowledging the depth of rest: "You've given yourself something beautiful..."
- Introduce grounding cues step by step:
  * "Gently wiggle your fingers and toes..."
  * "Notice the sounds in the room around you..."
  * "When you're ready, slowly open your eyes..."
- Affirm the experience: the calm they carry with them, the gift of this pause.
- Do NOT rush. Do NOT use alarming language or sudden transitions.
- Keep to 3-5 sentences. End with warmth and an invitation to carry this feeling forward.`,
};

// ---------------------------------------------------------------------------
// Transition hints (injected near phase budget limit)
// ---------------------------------------------------------------------------

/**
 * Wind-down cues injected when approaching the sentence budget limit for a phase.
 * Each hint steers the LLM toward the NEXT phase's topic without abruptly cutting off.
 *
 * CRITICAL: Non-resolution hints MUST NOT contain "end", "finish", or "final" --
 * these words cause premature session-ending language (Research Pitfall 4).
 */
export const TRANSITION_HINTS: Record<SessionPhase, string> = {
  atmosphere:
    "Begin to shift your attention toward the breath. Let the sense of warmth and safety you've built become the foundation for a gentle breathing practice.",
  breathing:
    "As your breath settles into its own rhythm, let your awareness broaden. Start to notice the sensations in your body -- the places where you feel warmth, weight, or softness.",
  sensory:
    "With this rich awareness of your body, allow yourself to sink deeper. Let go of noticing specific sensations and simply drift toward rest.",
  relaxation:
    "Gently, slowly, begin to return. Carry this deep calm with you as you become aware of the space around you once more.",
  resolution: "",
};

// ---------------------------------------------------------------------------
// Instruction builder
// ---------------------------------------------------------------------------

/**
 * Builds the complete instructions string for a given session phase.
 *
 * Combines: SAFETY_SYSTEM_PROMPT + SESSION_PROMPT + [moodContext] + phase label + phase prompt + optional transition hint.
 * Mood context is inserted BEFORE the CURRENT PHASE line so phase-specific instructions
 * remain the most-recent/salient context (Research Pitfall 5: recency bias in LLM attention).
 * Output is used directly as the `instructions` parameter in OpenAI Responses API calls.
 */
export function buildPhaseInstructions(
  phase: SessionPhase,
  transitionHint?: string,
  moodContext?: string,
  characterPrompt?: string,
): string {
  const parts: string[] = [
    SAFETY_SYSTEM_PROMPT,
    SYSTEM_BASE,
  ];

  if (characterPrompt) {
    parts.push(characterPrompt);
  }

  // Mood context before phase instructions for correct prompt ordering
  if (moodContext) {
    parts.push(moodContext);
  }

  parts.push(`CURRENT PHASE: ${phase.toUpperCase()}`);
  parts.push(PHASE_PROMPTS[phase]);

  if (transitionHint) {
    parts.push(`TRANSITION: ${transitionHint}`);
  }

  return parts.join("\n\n");
}
