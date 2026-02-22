"use client";

import { SESSION_PHASES, type SessionPhase } from "@/lib/session/phase-machine";

// ---------------------------------------------------------------------------
// PhaseIndicator -- 5-segment progress indicator for session phases
// ---------------------------------------------------------------------------

interface PhaseIndicatorProps {
  currentPhase: string | null;
}

export function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const activeIndex = currentPhase
    ? SESSION_PHASES.indexOf(currentPhase as SessionPhase)
    : -1;

  return (
    <div
      className="flex items-center gap-1.5"
      role="progressbar"
      aria-valuenow={activeIndex + 1}
      aria-valuemin={0}
      aria-valuemax={5}
      aria-label="Session progress"
    >
      {SESSION_PHASES.map((phase, index) => (
        <div
          key={phase}
          className={`h-1.5 w-6 rounded-full transition-colors duration-500 ${index <= activeIndex ? "bg-black" : "bg-gray-200"
            }`}
          title={phase.charAt(0).toUpperCase() + phase.slice(1)}
        />
      ))}
    </div>
  );
}
