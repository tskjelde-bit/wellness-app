/**
 * ElevenLabs SDK singleton and TTS configuration constants.
 *
 * Module-level singleton matches the OpenAI pattern in generate-session.ts.
 * The SDK reads ELEVENLABS_API_KEY from process.env automatically.
 */

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

// ---------------------------------------------------------------------------
// ElevenLabs client singleton
// ---------------------------------------------------------------------------
export const elevenlabs = new ElevenLabsClient();

// ---------------------------------------------------------------------------
// Voice options -- curated voices for wellness sessions
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// TTS configuration constants
// ---------------------------------------------------------------------------
export const TTS_CONFIG = {
  /** Default wellness voice -- overridden per-session when client selects a voice */
  voiceId: DEFAULT_VOICE_ID,
  /** Flash v2.5: ~75ms TTFB, lowest latency for streaming, 32 languages */
  modelId: "eleven_flash_v2_5",
  /** MP3 at 44.1kHz / 128kbps -- good quality with reasonable bandwidth */
  outputFormat: "mp3_44100_128" as const,
  /** Max latency optimization without disabling text normalizer (0-4 scale) */
  optimizeStreamingLatency: 3,
  /** Voice settings tuned for calm, consistent wellness delivery */
  voiceSettings: {
    stability: 0.7,
    similarityBoost: 0.75,
    style: 0.3,
    speed: 0.95,
  },
} as const;
