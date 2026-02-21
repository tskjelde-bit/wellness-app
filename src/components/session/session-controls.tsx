"use client";

// ---------------------------------------------------------------------------
// SessionControls -- Pause/resume toggle and end session controls
// ---------------------------------------------------------------------------

interface SessionControlsProps {
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
}

export function SessionControls({
  isPaused,
  onPause,
  onResume,
  onEnd,
}: SessionControlsProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Pause/Resume toggle */}
      <button
        onClick={isPaused ? onResume : onPause}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center text-cream/40 transition-colors hover:text-cream/60"
        aria-label={isPaused ? "Resume session" : "Pause session"}
      >
        {isPaused ? (
          /* Play icon */
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <polygon points="5,3 17,10 5,17" />
          </svg>
        ) : (
          /* Pause icon */
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <rect x="4" y="3" width="4" height="14" rx="1" />
            <rect x="12" y="3" width="4" height="14" rx="1" />
          </svg>
        )}
      </button>

      {/* End Session */}
      <button
        onClick={onEnd}
        className="text-xs text-cream/30 transition-colors hover:text-cream/60"
      >
        End Session
      </button>
    </div>
  );
}
