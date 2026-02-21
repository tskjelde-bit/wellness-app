/**
 * LLM module barrel exports.
 *
 * Re-exports the streaming pipeline, prompt utilities, and
 * sentence chunker for convenient imports via @/lib/llm.
 */

// Streaming pipeline
export {
  generateSession,
  streamLlmTokens,
  chunkBySentence,
  filterSafety,
} from "./generate-session";

// Prompt templates
export { buildSessionInstructions, SESSION_PROMPT } from "./prompts";

// Sentence chunker
export {
  splitAtSentenceBoundaries,
  type SplitResult,
} from "./sentence-chunker";
