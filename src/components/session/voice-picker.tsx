"use client";

import { VOICE_OPTIONS } from "@/lib/tts/elevenlabs-client";

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
          className={`rounded-xl border p-4 text-left transition-colors ${
            selected === voice.id
              ? "border-rose bg-rose/10"
              : "border-cream/10 bg-cream/5 hover:bg-cream/10"
          }`}
        >
          <span className="block font-bold text-cream/90">{voice.name}</span>
          <span className="block text-sm text-cream/50">{voice.preview}</span>
        </button>
      ))}
    </div>
  );
}
