/**
 * Static voice data for UI display.
 *
 * Separated from elevenlabs-client.ts so client components can import
 * this without pulling in the ElevenLabs SDK (which requires server-side
 * env vars and fails in the browser).
 */

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  preview: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: "LcfcDJNUP1GQjkzn1xUU",
    name: "Emily",
    description: "A gentle, calming voice ideal for meditation and mindfulness.",
    preview: "Soft & meditative",
  },
  {
    id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    description: "A warm, reassuring voice with steady pacing for guided relaxation.",
    preview: "Warm & steady",
  },
  {
    id: "JBFqnCBsd6RMkjVDRZzb",
    name: "George",
    description: "A deep, resonant voice that evokes grounding and safety.",
    preview: "Deep & grounding",
  },
];

/** Default voice for wellness sessions (Emily -- soft & meditative) */
export const DEFAULT_VOICE_ID = VOICE_OPTIONS[0].id;
