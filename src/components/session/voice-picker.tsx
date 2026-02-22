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
            ? "bg-gradient-to-r from-pink-300 to-rose-400 border-pink-400 text-rose-950 shadow-md"
            : "bg-gradient-to-br from-white/95 to-white/70 border border-pink-50 text-gray-800"
            }`}
        >
          <span className={`block font-bold underline decoration-pink-300 underline-offset-4 ${selected === voice.id ? "text-rose-950" : "text-gray-900"}`}>{voice.name}</span>
          <span className={`block text-xs mt-2 font-medium ${selected === voice.id ? "text-rose-900/80" : "text-gray-500"}`}>{voice.preview}</span>
        </button>
      ))}
    </div>
  );
}
