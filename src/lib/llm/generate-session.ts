/**
 * Three-stage async generator streaming pipeline for LLM wellness sessions.
 *
 * Stage 1: streamLlmTokens  - OpenAI Responses API streaming token deltas
 * Stage 2: chunkBySentence  - Accumulates tokens into complete sentences
 * Stage 3: filterSafety     - Runs each sentence through content safety filter
 *
 * The composed pipeline (generateSession) yields safe, complete sentences
 * ready for TTS consumption in Phase 4.
 */

import OpenAI from "openai";
import { SYSTEM_BASE } from "./prompts";
import { splitAtSentenceBoundaries } from "./sentence-chunker";
import { checkContentSafety, getRandomFallback } from "@/lib/safety";

// ---------------------------------------------------------------------------
// OpenAI client singleton (reads OPENAI_API_KEY from process.env)
// Matches the pattern used in src/lib/safety/moderation.ts
// ---------------------------------------------------------------------------
const openai = new OpenAI();

// ---------------------------------------------------------------------------
// Configurable defaults
// ---------------------------------------------------------------------------
const DEFAULT_MODEL = "gpt-4.1-mini";
const DEFAULT_TEMPERATURE = 0.8;
const MAX_OUTPUT_TOKENS = 4096;

// ---------------------------------------------------------------------------
// Stage 1: Stream raw token deltas from the LLM
// ---------------------------------------------------------------------------

export interface StreamLlmOptions {
  model?: string;
  temperature?: number;
  /** Chain to a prior response for multi-phase context continuity */
  previousResponseId?: string;
  /** Enable server-side response retention (required for chaining, defaults to false) */
  store?: boolean;
  /** Callback to capture the response ID from the response.created event */
  onResponseId?: (id: string) => void;
  /** AbortSignal for cancellation propagation from the orchestrator */
  signal?: AbortSignal;
  /** Override the default "Begin the session." input message */
  userMessage?: string;
  /** Override for complete instructions string (skips buildSessionInstructions) */
  instructions?: string;
}

/**
 * Streams raw token deltas from the OpenAI Responses API.
 *
 * Uses the `instructions` parameter with combined safety + session prompts.
 * On error, yields a single fallback message instead of throwing.
 *
 * Supports multi-phase context chaining via `previousResponseId` and `store`.
 * When `instructions` is provided, it is used directly (skipping buildSessionInstructions).
 *
 * @param sessionPrompt - Optional session-specific context for instructions
 * @param options - Model, temperature, chaining, and cancellation overrides
 */
export async function* streamLlmTokens(
  sessionPrompt: string,
  options?: StreamLlmOptions,
): AsyncGenerator<string> {
  const model = options?.model ?? DEFAULT_MODEL;
  const temperature = options?.temperature ?? DEFAULT_TEMPERATURE;

  // Respect abort signal before starting
  if (options?.signal?.aborted) return;

  try {
    const stream = await openai.responses.create({
      model,
      instructions:
        options?.instructions ?? SYSTEM_BASE,
      input: [
        { role: "user", content: options?.userMessage ?? "Begin the session." },
      ],
      temperature,
      max_output_tokens: MAX_OUTPUT_TOKENS,
      store: options?.store ?? false,
      ...(options?.previousResponseId && {
        previous_response_id: options.previousResponseId,
      }),
      stream: true,
    });

    for await (const event of stream) {
      // Capture response ID on creation
      if (event.type === "response.created") {
        options?.onResponseId?.(event.response.id);
      }

      if (event.type === "response.output_text.delta") {
        yield event.delta;
      }

      // Check abort between events
      if (options?.signal?.aborted) return;
    }
  } catch {
    // Stream error: yield a wellness fallback instead of crashing
    yield getRandomFallback();
  }
}

// ---------------------------------------------------------------------------
// Stage 2: Accumulate token deltas into complete sentences
// ---------------------------------------------------------------------------

/**
 * Accumulates streaming token deltas into complete sentences.
 *
 * Uses the sentence boundary chunker from Plan 01 to split at natural
 * sentence boundaries (. ! ?) while respecting abbreviations and
 * minimum length thresholds for TTS-quality output.
 *
 * @param tokens - Async generator of token delta strings
 * @param minLength - Minimum sentence length for emission (default: 40)
 */
export async function* chunkBySentence(
  tokens: AsyncGenerator<string>,
  minLength?: number,
): AsyncGenerator<string> {
  let buffer = "";

  for await (const token of tokens) {
    buffer += token;

    const result = splitAtSentenceBoundaries(buffer, minLength);

    for (const sentence of result.complete) {
      yield sentence;
    }

    buffer = result.remainder;
  }

  // Flush any remaining buffered text
  const trimmed = buffer.trim();
  if (trimmed.length > 0) {
    yield trimmed;
  }
}

// ---------------------------------------------------------------------------
// Stage 3: Safety-filter each complete sentence
// ---------------------------------------------------------------------------

/**
 * Filters each sentence through the three-layer content safety system.
 *
 * Yields `result.output` which is guaranteed non-empty by the safety
 * module's contract: safe text passes through unchanged, unsafe text
 * is replaced with a wellness-appropriate fallback.
 *
 * No try/catch needed: checkContentSafety handles its own errors internally.
 *
 * @param sentences - Async generator of complete sentence strings
 */
export async function* filterSafety(
  sentences: AsyncGenerator<string>,
): AsyncGenerator<string> {
  for await (const sentence of sentences) {
    const result = await checkContentSafety(sentence);
    yield result.output;
  }
}

// ---------------------------------------------------------------------------
// Composed pipeline: the primary public API
// ---------------------------------------------------------------------------

/**
 * Generates a wellness session by composing three pipeline stages:
 *   streamLlmTokens -> chunkBySentence -> filterSafety
 *
 * Yields safe, complete sentences ready for TTS consumption.
 * This is the primary public API that Phase 4 will consume.
 *
 * @param sessionPrompt - Optional session-specific context
 * @param options - Model, temperature, and minSentenceLength overrides
 */
export async function* generateSession(
  sessionPrompt: string,
  options?: {
    model?: string;
    temperature?: number;
    minSentenceLength?: number;
  },
): AsyncGenerator<string> {
  const tokens = streamLlmTokens(sessionPrompt, {
    model: options?.model,
    temperature: options?.temperature,
  });

  const sentences = chunkBySentence(tokens, options?.minSentenceLength);

  const safeSentences = filterSafety(sentences);

  yield* safeSentences;
}
