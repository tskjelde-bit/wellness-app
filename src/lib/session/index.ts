/**
 * Session module -- barrel exports for the 5-phase wellness session flow.
 *
 * Provides phase definitions, prompt templates, timing budgets, and FSM utilities.
 */

// Phase state machine
export {
  SESSION_PHASES,
  type SessionPhase,
  getNextPhase,
  isTerminalPhase,
  getPhaseIndex,
  type PhaseTransitionResult,
} from "./phase-machine";

// Phase prompt templates
export {
  PHASE_PROMPTS,
  TRANSITION_HINTS,
  buildPhaseInstructions,
} from "./phase-prompts";

// Phase timing configuration
export {
  getSessionBudgets,
  type PhaseConfig,
  PHASE_PROPORTIONS,
} from "./phase-config";
