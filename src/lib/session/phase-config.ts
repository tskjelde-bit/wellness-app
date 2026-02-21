/**
 * Phase timing budgets -- configurable sentence limits per session length.
 *
 * Each phase gets a proportion of the total sentence budget based on PHASE_PROPORTIONS.
 * Wind-down thresholds tell the orchestrator when to inject transition hints.
 *
 * At ~4.5 seconds per sentence (natural speaking pace for guided wellness content),
 * SENTENCES_PER_MINUTE is approximately 13.
 */

import type { SessionPhase } from "./phase-machine";
import { SESSION_PHASES } from "./phase-machine";

// ---------------------------------------------------------------------------
// Configuration types
// ---------------------------------------------------------------------------

export interface PhaseConfig {
  /** Maximum number of sentences for this phase */
  sentenceBudget: number;
  /** Sentence count at which to inject the transition hint */
  windDownAt: number;
}

// ---------------------------------------------------------------------------
// Phase proportions (must sum to 1.0)
// ---------------------------------------------------------------------------

export const PHASE_PROPORTIONS: Record<SessionPhase, number> = {
  atmosphere: 0.12,
  breathing: 0.2,
  sensory: 0.28,
  relaxation: 0.25,
  resolution: 0.15,
};

// ---------------------------------------------------------------------------
// Timing constants
// ---------------------------------------------------------------------------

/** Approximate sentences per minute at natural wellness-guide pacing (~4.5s/sentence). */
const SENTENCES_PER_MINUTE = 13;

// ---------------------------------------------------------------------------
// Budget calculator
// ---------------------------------------------------------------------------

/**
 * Calculates per-phase sentence budgets and wind-down thresholds for a given session length.
 *
 * @param sessionLengthMinutes - Total session duration (e.g., 10, 15, 20, 30)
 * @returns Record mapping each phase to its PhaseConfig (sentenceBudget + windDownAt)
 *
 * @example
 * ```ts
 * const budgets = getSessionBudgets(15);
 * // budgets.atmosphere.sentenceBudget ~= 23
 * // budgets.atmosphere.windDownAt ~= 20
 * ```
 */
export function getSessionBudgets(
  sessionLengthMinutes: number,
): Record<SessionPhase, PhaseConfig> {
  const totalSentences = Math.round(sessionLengthMinutes * SENTENCES_PER_MINUTE);

  const result = {} as Record<SessionPhase, PhaseConfig>;

  for (const phase of SESSION_PHASES) {
    const sentenceBudget = Math.round(totalSentences * PHASE_PROPORTIONS[phase]);
    const windDownReserve = Math.max(3, Math.round(sentenceBudget * 0.15));
    const windDownAt = sentenceBudget - windDownReserve;

    result[phase] = {
      sentenceBudget,
      windDownAt,
    };
  }

  return result;
}
