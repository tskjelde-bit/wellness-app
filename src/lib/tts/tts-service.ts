/**
 * TTS service: converts a text sentence into an async stream of audio chunks.
 *
 * Uses OpenAI TTS API (tts-1 model) for audio synthesis. Each invocation
 * produces a stream of Uint8Array MP3 audio chunks for a single sentence.
 */

import OpenAI from "openai";
import { DEFAULT_VOICE_ID } from "./voice-options";

// ---------------------------------------------------------------------------
// OpenAI client singleton (lazy to avoid build-time env var errors)
// ---------------------------------------------------------------------------
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) _openai = new OpenAI();
  return _openai;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SynthesizeOptions {
  /** Override the default voice (e.g. "nova", "shimmer", "alloy") */
  voiceId?: string;
  /** Unused with OpenAI TTS -- kept for interface compatibility */
  previousText?: string;
  /** Unused with OpenAI TTS -- kept for interface compatibility */
  nextText?: string;
  /** AbortSignal for clean cancellation */
  signal?: AbortSignal;
}

// ---------------------------------------------------------------------------
// synthesizeSentence
// ---------------------------------------------------------------------------

/**
 * Converts a text sentence into an async stream of audio chunks (Uint8Array).
 *
 * Uses OpenAI TTS API with the tts-1 model for low-latency streaming.
 *
 * On error: logs the error and returns (does not throw). Downstream handles
 * missing audio gracefully with text fallback.
 */
export async function* synthesizeSentence(
  text: string,
  options?: SynthesizeOptions,
): AsyncGenerator<Uint8Array> {
  const voice = (options?.voiceId ?? DEFAULT_VOICE_ID) as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

  try {
    const response = await getOpenAI().audio.speech.create({
      model: "tts-1",
      voice,
      input: text,
      response_format: "mp3",
      speed: 0.95,
    });

    // response.body is a ReadableStream<Uint8Array>
    const body = response.body;
    if (!body) return;

    const reader = (body as ReadableStream<Uint8Array>).getReader();
    try {
      while (true) {
        if (options?.signal?.aborted) break;
        const { done, value } = await reader.read();
        if (done) break;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    // Log and return gracefully -- downstream handles missing audio
    console.error("[TTS] synthesizeSentence error:", error);
  }
}
