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
        className="flex min-h-[56px] min-w-[56px] items-center justify-center rounded-full bg-gradient-to-br from-white/90 to-white/70 shadow-lg text-gray-800 transition-all hover:scale-110 active:scale-95 border border-pink-50"
        aria-label={isPaused ? "Resume session" : "Pause session"}
      >
        {isPaused ? (
          /* Play icon */
          <svg
            width="24"
            height="24"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="text-rose-600"
            aria-hidden="true"
          >
            <polygon points="5,3 17,10 5,17" />
          </svg>
        ) : (
          /* Pause icon */
          <svg
            width="24"
            height="24"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="text-gray-600"
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
        className="text-xs font-bold text-gray-500 transition-colors hover:text-gray-800 underline underline-offset-4"
      >
        Avslutt sesjon
      </button>
    </div>
  );
}
