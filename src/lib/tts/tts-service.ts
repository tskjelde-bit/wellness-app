/**
 * TTS service: converts a text sentence into an async stream of audio chunks.
 *
 * Wraps the ElevenLabs `textToSpeech.stream()` SDK call. Each invocation
 * produces a stream of Uint8Array MP3 audio chunks for a single sentence.
 *
 * Previous text context is passed to ElevenLabs for prosody continuity
 * across sentences within a session.
 */

import { elevenlabs, TTS_CONFIG } from "./elevenlabs-client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SynthesizeOptions {
  /** Override the default voice ID */
  voiceId?: string;
  /** Text preceding this sentence for prosody continuity (max ~1000 chars) */
  previousText?: string;
  /** Text following this sentence for prosody continuity */
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
 * Uses the ElevenLabs HTTP streaming endpoint per sentence. The SDK returns
 * a ReadableStream which we iterate and yield chunk-by-chunk.
 *
 * On error: logs the error and returns (does not throw). Downstream handles
 * missing audio gracefully, similar to the LLM error pattern in generate-session.ts.
 *
 * @param text - The sentence to synthesize
 * @param options - Voice, prosody context, and abort signal options
 */
export async function* synthesizeSentence(
  text: string,
  options?: SynthesizeOptions,
): AsyncGenerator<Uint8Array> {
  const voiceId = options?.voiceId ?? TTS_CONFIG.voiceId;

  try {
    const audioStream = await elevenlabs.textToSpeech.stream(
      voiceId,
      {
        text,
        modelId: TTS_CONFIG.modelId,
        outputFormat: TTS_CONFIG.outputFormat,
        optimizeStreamingLatency: TTS_CONFIG.optimizeStreamingLatency,
        voiceSettings: {
          stability: TTS_CONFIG.voiceSettings.stability,
          similarityBoost: TTS_CONFIG.voiceSettings.similarityBoost,
          style: TTS_CONFIG.voiceSettings.style,
          speed: TTS_CONFIG.voiceSettings.speed,
        },
        previousText: options?.previousText,
        nextText: options?.nextText,
      },
      {
        abortSignal: options?.signal,
      },
    );

    // ReadableStream does not implement Symbol.asyncIterator in all
    // TypeScript targets, so we use getReader() for compatibility.
    const reader = audioStream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    // Log and return gracefully -- downstream handles missing audio
    // similar to how streamLlmTokens yields fallback on error
    console.error("[TTS] synthesizeSentence error:", error);
  }
}
