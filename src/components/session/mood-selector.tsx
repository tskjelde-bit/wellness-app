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
    <div className="grid w-full grid-cols-2 gap-3">
      {MOOD_OPTIONS.map((mood) => (
        <button
          key={mood.id}
          onClick={() => onSelect(mood.id)}
          className={`flex items-center justify-center gap-2 min-h-[56px] rounded-xl px-4 py-3 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${selected === mood.id
              ? "bg-rose text-white shadow-glow"
              : "bg-cream/5 text-cream/70 hover:bg-cream/10 border border-gold/10"
            }`}
        >
          <span className="text-xl">{mood.emoji}</span>
          <span>{mood.label}</span>
        </button>
      ))}
    </div>
  );
}
