/**
 * Cascading audio pipeline: generateSession -> TTS -> AudioChunkEvents
 *
 * Connects the Phase 3 LLM text generation pipeline to the TTS service,
 * yielding typed AudioChunkEvents with sentence metadata. The cascading
 * design enables pipeline parallelism: the LLM generates sentence N+1
 * while TTS synthesizes sentence N, targeting <2 seconds to first audio.
 *
 * Previous text context (up to 1000 chars) is passed to ElevenLabs
 * for prosody continuity across sentences within a session.
 *
 * AbortController signal propagates through both the LLM generation
 * and TTS synthesis for clean cancellation.
 */

import { generateSession } from "@/lib/llm";
import { synthesizeSentence } from "./tts-service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AudioChunkEvent =
  | { type: "sentence_start"; text: string; index: number }
  | { type: "audio"; data: Uint8Array }
  | { type: "sentence_end"; index: number }
  | { type: "session_end" };

export interface StreamSessionOptions {
  /** LLM model override */
  model?: string;
  /** LLM temperature override */
  temperature?: number;
  /** AbortSignal for clean cancellation of the entire pipeline */
  signal?: AbortSignal;
}

// ---------------------------------------------------------------------------
// streamSessionAudio
// ---------------------------------------------------------------------------

/**
 * Produces typed AudioChunkEvents from the full LLM -> TTS pipeline.
 *
 * Iterates generateSession (Phase 3) for safe, complete sentences,
 * then synthesizes each sentence via ElevenLabs, yielding audio chunks
 * as they arrive. Sentence metadata events bracket each synthesis run
 * for downstream consumers (e.g. WebSocket handler, caption display).
 *
 * On AbortError: yields session_end and returns cleanly.
 * On other errors: logs the error, yields session_end, and returns.
 *
 * @param sessionPrompt - Prompt context for the LLM session
 * @param options - Model, temperature, and abort signal overrides
 */
export async function* streamSessionAudio(
  sessionPrompt: string,
  options?: StreamSessionOptions,
): AsyncGenerator<AudioChunkEvent> {
  const signal = options?.signal;

  let previousText = "";
  let sentenceIndex = 0;

  try {
    for await (const sentence of generateSession(sessionPrompt, {
      model: options?.model,
      temperature: options?.temperature,
    })) {
      // Check abort at the start of each iteration
      if (signal?.aborted) {
        return;
      }

      // Emit sentence start marker
      yield { type: "sentence_start", text: sentence, index: sentenceIndex };

      // Synthesize sentence to audio chunks
      for await (const chunk of synthesizeSentence(sentence, {
        previousText: previousText.slice(-1000),
        signal,
      })) {
        yield { type: "audio", data: chunk };
      }

      // Emit sentence end marker
      yield { type: "sentence_end", index: sentenceIndex };

      // Accumulate previous text for prosody context
      previousText += " " + sentence;
      sentenceIndex++;
    }

    // All sentences processed
    yield { type: "session_end" };
  } catch (error) {
    // AbortError is expected during clean cancellation
    if (error instanceof Error && error.name === "AbortError") {
      yield { type: "session_end" };
      return;
    }

    // Unexpected error: log and end session gracefully
    console.error("[TTS] streamSessionAudio pipeline error:", error);
    yield { type: "session_end" };
  }
}
