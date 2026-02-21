/**
 * Session phase state machine -- linear FSM for the 5-phase wellness session flow.
 *
 * Phases progress strictly forward: atmosphere -> breathing -> sensory -> relaxation -> resolution.
 * No branching, no guards, no parallel states. Resolution is the terminal state.
 */

// ---------------------------------------------------------------------------
// Phase definitions
// ---------------------------------------------------------------------------

export const SESSION_PHASES = [
  "atmosphere",
  "breathing",
  "sensory",
  "relaxation",
  "resolution",
] as const;

export type SessionPhase = (typeof SESSION_PHASES)[number];

// ---------------------------------------------------------------------------
// Transition table
// ---------------------------------------------------------------------------

const TRANSITIONS: Record<SessionPhase, SessionPhase | null> = {
  atmosphere: "breathing",
  breathing: "sensory",
  sensory: "relaxation",
  relaxation: "resolution",
  resolution: null,
};

// ---------------------------------------------------------------------------
// FSM utilities
// ---------------------------------------------------------------------------

/** Returns the next phase, or null if the current phase is terminal (resolution). */
export function getNextPhase(current: SessionPhase): SessionPhase | null {
  return TRANSITIONS[current];
}

/** Returns true if the given phase is the terminal state (resolution). */
export function isTerminalPhase(phase: SessionPhase): boolean {
  return TRANSITIONS[phase] === null;
}

/** Returns the zero-based index of the phase within SESSION_PHASES. */
export function getPhaseIndex(phase: SessionPhase): number {
  return SESSION_PHASES.indexOf(phase);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PhaseTransitionResult {
  from: SessionPhase;
  to: SessionPhase | null;
  isComplete: boolean;
}
