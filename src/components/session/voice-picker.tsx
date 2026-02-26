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
          className={`rounded-xl border p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${selected === voice.id
            ? "bg-gradient-to-b from-gray-800 to-gray-950 border-black text-white shadow-xl"
            : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 text-gray-800"
            }`}
        >
          <span className={`block font-black uppercase tracking-tight underline decoration-gray-400 underline-offset-4 ${selected === voice.id ? "text-white" : "text-gray-950"}`}>{voice.name}</span>
          <span className={`block text-xs mt-2 font-bold ${selected === voice.id ? "text-gray-400" : "text-gray-500"}`}>{voice.preview}</span>
        </button>
      ))}
    </div>
  );
}
