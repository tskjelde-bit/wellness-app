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
import { buildSessionInstructions } from "./prompts";
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

/**
 * Streams raw token deltas from the OpenAI Responses API.
 *
 * Uses the `instructions` parameter with combined safety + session prompts.
 * On error, yields a single fallback message instead of throwing.
 *
 * @param sessionPrompt - Optional session-specific context for instructions
 * @param options - Model and temperature overrides
 */
export async function* streamLlmTokens(
  sessionPrompt: string,
  options?: { model?: string; temperature?: number },
): AsyncGenerator<string> {
  const model = options?.model ?? DEFAULT_MODEL;
  const temperature = options?.temperature ?? DEFAULT_TEMPERATURE;

  try {
    const stream = await openai.responses.create({
      model,
      instructions: buildSessionInstructions(sessionPrompt),
      input: [{ role: "user", content: "Begin the session." }],
      temperature,
      max_output_tokens: MAX_OUTPUT_TOKENS,
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        yield event.delta;
      }
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
