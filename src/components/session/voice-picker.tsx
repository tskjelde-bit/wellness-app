"use client";

import { VOICE_OPTIONS } from "@/lib/tts/voice-options";

// ---------------------------------------------------------------------------
// VoicePicker -- voice selection cards for pre-session flow
// ---------------------------------------------------------------------------

interface VoicePickerProps {
  selected: string;
  onSelect: (voiceId: string) => void;
}

/**
 * Displays 3 curated voice option cards in a vertical stack.
 * Each card shows the voice name, preview description, and selection state.
 */
export function VoicePicker({ selected, onSelect }: VoicePickerProps) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {VOICE_OPTIONS.map((voice) => (
        <button
          key={voice.id}
          onClick={() => onSelect(voice.id)}
          className={`rounded-2xl border p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${selected === voice.id
              ? "border-rose bg-rose/20 shadow-glow ring-1 ring-rose"
              : "border-gold/10 bg-cream/5 hover:bg-cream/10"
            }`}
        >
          <span className="block font-bold text-cream underline decoration-gold/30 underline-offset-4">{voice.name}</span>
          <span className="block text-sm text-cream/50 mt-1">{voice.preview}</span>
        </button>
      ))}
    </div>
  );
}
