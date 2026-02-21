/**
 * ElevenLabs SDK singleton and TTS configuration constants.
 *
 * Server-only -- do NOT import this file from client components.
 * For voice data (VOICE_OPTIONS, DEFAULT_VOICE_ID), import from ./voice-options.
 */

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { DEFAULT_VOICE_ID } from "./voice-options";

// ---------------------------------------------------------------------------
// ElevenLabs client singleton (lazy -- avoids crash if key missing at import)
// ---------------------------------------------------------------------------
let _elevenlabs: ElevenLabsClient | null = null;

export function getElevenLabsClient(): ElevenLabsClient {
  if (!_elevenlabs) {
    _elevenlabs = new ElevenLabsClient();
  }
  return _elevenlabs;
}

// Re-export voice data for backward compatibility
export { VOICE_OPTIONS, DEFAULT_VOICE_ID } from "./voice-options";
export type { VoiceOption } from "./voice-options";

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
