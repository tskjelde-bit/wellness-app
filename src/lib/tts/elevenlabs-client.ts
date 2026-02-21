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
// TTS configuration constants
// ---------------------------------------------------------------------------
export const TTS_CONFIG = {
  /** ElevenLabs "George" voice -- warm male narration; placeholder until user selects final voice */
  voiceId: "JBFqnCBsd6RMkjVDRZzb",
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
