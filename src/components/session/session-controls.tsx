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
        className="flex min-h-[64px] min-w-[64px] items-center justify-center rounded-full bg-gradient-to-b from-white to-gray-50 shadow-soft text-black transition-all hover:scale-110 active:scale-90 border border-gray-200"
        aria-label={isPaused ? "Resume session" : "Pause session"}
      >
        {isPaused ? (
          /* Play icon */
          <svg
            width="28"
            height="28"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="text-black"
            aria-hidden="true"
          >
            <polygon points="5,3 17,10 5,17" />
          </svg>
        ) : (
          /* Pause icon */
          <svg
            width="28"
            height="28"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="text-gray-900"
            aria-hidden="true"
          >
            <rect x="4" y="3" width="5" height="14" rx="1" />
            <rect x="11" y="3" width="5" height="14" rx="1" />
          </svg>
        )}
      </button>

      {/* End Session */}
      <button
        onClick={onEnd}
        className="text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase transition-colors hover:text-black underline underline-offset-[12px] decoration-gray-200"
      >
        Avslutt sesjon
      </button>
    </div>
  );
}
