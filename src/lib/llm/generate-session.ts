// src/lib/llm/generate-session.ts
/**
 * Streaming pipeline for LLM sessions (safety filters removed).
 */
import OpenAI from "openai";
import { SYSTEM_BASE } from "./prompts";
import { splitAtSentenceBoundaries } from "./sentence-chunker";
import { getLlmSettingsConfig } from "@/lib/admin/config-sections";

// xAI (Grok) client — OpenAI-compatible API
let _client: OpenAI | null = null;
function getLlmClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: "https://api.x.ai/v1",
    });
  }
  return _client;
}

const DEFAULT_MODEL = "grok-3-mini";
const DEFAULT_TEMPERATURE = 0.8;
const MAX_OUTPUT_TOKENS = 4096;

/**
 * Get LLM settings from DB config (with file fallback).
 */
export async function getResolvedLlmSettings() {
  const config = await getLlmSettingsConfig();
  return {
    model: config.model || DEFAULT_MODEL,
    temperature: config.temperature ?? DEFAULT_TEMPERATURE,
    maxOutputTokens: config.maxOutputTokens ?? MAX_OUTPUT_TOKENS,
  };
}

export interface StreamLlmOptions {
  model?: string;
  temperature?: number;
  previousResponseId?: string;
  store?: boolean;
  onResponseId?: (id: string) => void;
  signal?: AbortSignal;
  userMessage?: string;
  instructions?: string;
}

export async function* streamLlmTokens(
  sessionPrompt: string,
  options?: StreamLlmOptions,
): AsyncGenerator<string> {
  const model = options?.model ?? DEFAULT_MODEL;
  const temperature = options?.temperature ?? DEFAULT_TEMPERATURE;

  if (options?.signal?.aborted) return;

  try {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: options?.instructions ?? SYSTEM_BASE },
      { role: "user", content: options?.userMessage ?? "Begin the session." },
    ];

    const stream = await getLlmClient().chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: MAX_OUTPUT_TOKENS,
      stream: true,
    });

    for await (const chunk of stream) {
      if (options?.signal?.aborted) break;
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  } catch (error) {
    console.error("[LLM] streamLlmTokens error:", error);
  }
}

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

  const trimmed = buffer.trim();
  if (trimmed.length > 0) {
    yield trimmed;
  }
}

// Safety filter removed - pass through directly
export async function* filterSafety(
  sentences: AsyncGenerator<string>,
): AsyncGenerator<string> {
  yield* sentences;
}

export async function* generateSession(
  sessionPrompt: string,
  options?: { model?: string; temperature?: number; minSentenceLength?: number },
): AsyncGenerator<string> {
  const tokens = streamLlmTokens(sessionPrompt, {
    model: options?.model,
    temperature: options?.temperature,
  });
  const sentences = chunkBySentence(tokens, options?.minSentenceLength);
  const safeSentences = filterSafety(sentences);
  yield* safeSentences;
}
