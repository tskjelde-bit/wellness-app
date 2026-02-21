"use client";

import { MOOD_OPTIONS } from "@/lib/session/mood-prompts";

// ---------------------------------------------------------------------------
// MoodSelector -- grid of mood options for pre-session flow
// ---------------------------------------------------------------------------

interface MoodSelectorProps {
  selected: string;
  onSelect: (mood: string) => void;
}

/**
 * Displays a grid of mood buttons (5 options) allowing the user to
 * indicate their current emotional state before a session begins.
 * The selected mood is sent to the AI to adapt guidance accordingly.
 */
export function MoodSelector({ selected, onSelect }: MoodSelectorProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {MOOD_OPTIONS.map((mood) => (
        <button
          key={mood.id}
          onClick={() => onSelect(mood.id)}
          className={`min-h-[48px] rounded-xl px-5 py-3 text-base font-medium transition-colors ${
            selected === mood.id
              ? "bg-rose text-white"
              : "bg-cream/10 text-cream/70 hover:bg-cream/15"
          }`}
        >
          {mood.emoji} {mood.label}
        </button>
      ))}
    </div>
  );
}
