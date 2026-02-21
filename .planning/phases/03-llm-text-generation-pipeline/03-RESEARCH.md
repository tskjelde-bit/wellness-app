# Phase 3: LLM Text Generation Pipeline - Research

**Researched:** 2026-02-21
**Domain:** OpenAI Responses API streaming, sentence-boundary text chunking, per-sentence safety filtering
**Confidence:** HIGH

## Summary

Phase 3 builds the text generation layer of the voice pipeline: an OpenAI LLM streams wellness session content in real-time, a sentence-boundary chunker splits the token stream into natural sentences, and the existing three-layer safety filter (from Phase 2) inspects every sentence before it reaches downstream consumers (TTS in Phase 4).

The project already has the OpenAI Node SDK v6.22.0 installed (`openai` package) and a fully functional `checkContentSafety()` pipeline in `src/lib/safety/index.ts`. The `SAFETY_SYSTEM_PROMPT` in `src/lib/safety/system-prompt-safety.ts` is explicitly designed to be prepended to the LLM system prompt in this phase. The Responses API is OpenAI's current-generation API (replacing Chat Completions for new development), and supports an `instructions` parameter that serves as the system prompt equivalent.

The architecture is a three-stage async generator pipeline: LLM stream produces token deltas, a sentence buffer accumulates tokens until sentence boundaries are detected (min ~40 chars), and the safety filter checks each complete sentence before yielding it downstream. This design uses TypeScript async generators (`AsyncGenerator<string>`) for clean composability and backpressure handling.

**Primary recommendation:** Use `client.responses.create()` with `stream: true` and the `instructions` parameter (containing `SAFETY_SYSTEM_PROMPT` + session-specific prompt), pipe token deltas through a regex-based sentence boundary buffer, and run each complete sentence through the existing `checkContentSafety()` — yielding safe output (or fallback replacement) as an async generator that Phase 4 consumes.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VOIC-01 | LLM generates session content in real-time via streaming API (OpenAI Responses API) | OpenAI Responses API with `client.responses.create({ stream: true })` provides server-sent event streaming. The `instructions` parameter carries the system prompt (SAFETY_SYSTEM_PROMPT + session context). Token deltas arrive via `response.output_text.delta` events. SDK v6.22.0 already installed. |
| VOIC-02 | Generated text is chunked at sentence boundaries for natural TTS prosody | Sentence boundary buffer accumulates streaming token deltas and emits complete sentences at `.` `!` `?` boundaries when buffer length >= 40 chars. Handles abbreviations (Mr., Dr., etc.) via allowlist. Regex-based approach avoids external dependency. Flush remaining buffer on stream end. |
| VOIC-06 | Safety filter inspects every sentence between LLM output and TTS input | Existing `checkContentSafety()` from `src/lib/safety/index.ts` runs on each chunked sentence. Returns `SafetyCheckResult` with `.output` field guaranteed non-empty (original if safe, fallback if blocked). Pipeline yields `.output` directly — downstream never sees unsafe content. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `openai` | ^6.22.0 | OpenAI API client (Responses API, Moderation API) | Already installed. Official SDK with TypeScript types. Supports Responses API streaming via `for await` pattern. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | Sentence boundary detection | Hand-roll with regex — see "Don't Hand-Roll" exception below |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled sentence splitter | `sbd` npm package (v1.0.19) | `sbd` last published 5 years ago, no TypeScript types, pulls in dependencies. Our needs are narrow (split at `.!?` with abbreviation handling) — a ~30-line regex solution is simpler, dependency-free, and fully typed. |
| Responses API | Chat Completions API | Chat Completions is the older API. Responses API is OpenAI's current-generation API with `instructions` parameter (cleaner system prompt), built-in conversation state via `previous_response_id`, and richer streaming events. Project requirement explicitly calls for Responses API. |
| `gpt-4.1-mini` | `gpt-4o` / `gpt-4.1` | Full-size models produce higher quality creative text but cost 5-6x more per token. For wellness session scripts (guided relaxation, not complex reasoning), `gpt-4.1-mini` provides excellent quality at $0.40/1M input, $1.60/1M output. Model choice should be configurable. |

**Installation:**
```bash
# No new packages needed — openai SDK already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── llm/
│   │   ├── index.ts              # Barrel exports
│   │   ├── generate-session.ts   # Main streaming pipeline (async generator)
│   │   ├── sentence-chunker.ts   # Sentence boundary buffer
│   │   └── prompts.ts            # Session prompt templates (uses SAFETY_SYSTEM_PROMPT)
│   └── safety/                   # Existing (Phase 2) — consumed, not modified
│       ├── index.ts              # checkContentSafety() entry point
│       ├── system-prompt-safety.ts  # SAFETY_SYSTEM_PROMPT (Layer 1)
│       ├── moderation.ts         # OpenAI Moderation API (Layer 2)
│       ├── keyword-blocklist.ts  # Keyword filter (Layer 3)
│       ├── crisis-detector.ts    # Crisis detection
│       └── constants.ts          # Fallbacks, blocklist terms
```

### Pattern 1: Three-Stage Async Generator Pipeline
**What:** LLM stream → sentence chunker → safety filter, each stage an async generator
**When to use:** When processing streaming data through sequential transformation stages
**Example:**
```typescript
// Source: OpenAI Responses API streaming docs + async generator pattern
import OpenAI from "openai";
import { SAFETY_SYSTEM_PROMPT } from "@/lib/safety";
import { checkContentSafety } from "@/lib/safety";

const openai = new OpenAI(); // reads OPENAI_API_KEY from env

// Stage 1: LLM token stream
async function* streamLlmTokens(
  sessionPrompt: string,
  model: string = "gpt-4.1-mini",
): AsyncGenerator<string> {
  const stream = await openai.responses.create({
    model,
    instructions: `${SAFETY_SYSTEM_PROMPT}\n\n${sessionPrompt}`,
    input: [{ role: "user", content: "Begin the session." }],
    stream: true,
    temperature: 0.8,
  });

  for await (const event of stream) {
    if (event.type === "response.output_text.delta") {
      yield event.delta;
    }
  }
}

// Stage 2: Sentence boundary chunker
async function* chunkBySentence(
  tokens: AsyncGenerator<string>,
  minLength: number = 40,
): AsyncGenerator<string> {
  let buffer = "";

  for await (const token of tokens) {
    buffer += token;
    // Check for sentence boundaries
    const sentences = splitAtSentenceBoundaries(buffer, minLength);
    for (const sentence of sentences.complete) {
      yield sentence;
    }
    buffer = sentences.remainder;
  }

  // Flush remaining buffer on stream end
  if (buffer.trim().length > 0) {
    yield buffer.trim();
  }
}

// Stage 3: Safety filter
async function* filterSafety(
  sentences: AsyncGenerator<string>,
): AsyncGenerator<string> {
  for await (const sentence of sentences) {
    const result = await checkContentSafety(sentence);
    // result.output is ALWAYS non-empty (original or fallback)
    yield result.output;
  }
}

// Composed pipeline
async function* generateSession(
  sessionPrompt: string,
  model?: string,
): AsyncGenerator<string> {
  const tokens = streamLlmTokens(sessionPrompt, model);
  const sentences = chunkBySentence(tokens);
  yield* filterSafety(sentences);
}
```

### Pattern 2: Sentence Boundary Buffer with Abbreviation Handling
**What:** Accumulate streaming text, split at `.!?` boundaries, handle abbreviations
**When to use:** When splitting streaming text into natural sentences for TTS
**Example:**
```typescript
// Abbreviations that should NOT trigger sentence splits
const ABBREVIATIONS = new Set([
  "mr", "mrs", "ms", "dr", "prof", "sr", "jr",
  "st", "ave", "blvd", "dept", "est", "govt",
  "i.e", "e.g", "vs", "etc", "approx", "dept",
  "min", "max", "no", "vol",
]);

interface SplitResult {
  complete: string[];  // Sentences ready to emit
  remainder: string;   // Incomplete text still buffering
}

function splitAtSentenceBoundaries(
  text: string,
  minLength: number = 40,
): SplitResult {
  const complete: string[] = [];
  let remaining = text;

  // Match sentence-ending punctuation followed by space or end
  const sentenceEndRegex = /([.!?]+)(\s+|$)/g;
  let lastCutIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = sentenceEndRegex.exec(remaining)) !== null) {
    const endIndex = match.index + match[1].length;
    const candidate = remaining.slice(lastCutIndex, endIndex).trim();

    // Skip if this looks like an abbreviation
    if (match[1] === ".") {
      const wordBefore = candidate.split(/\s+/).pop()?.replace(/\.$/, "").toLowerCase();
      if (wordBefore && ABBREVIATIONS.has(wordBefore)) {
        continue;
      }
    }

    // Only emit if meets minimum length
    if (candidate.length >= minLength) {
      complete.push(candidate);
      lastCutIndex = match.index + match[0].length;
    }
  }

  return {
    complete,
    remainder: remaining.slice(lastCutIndex),
  };
}
```

### Pattern 3: OpenAI Responses API with Instructions Parameter
**What:** The `instructions` parameter replaces the system prompt role from Chat Completions
**When to use:** Always — this is how system-level behavior is set in the Responses API
**Example:**
```typescript
// Source: OpenAI Responses API documentation
const stream = await openai.responses.create({
  model: "gpt-4.1-mini",
  // instructions = system prompt (takes priority over input messages)
  instructions: `${SAFETY_SYSTEM_PROMPT}\n\nYou are guiding a wellness session...`,
  // input can be a string or array of role/content objects
  input: [
    { role: "user", content: "Begin the breathing exercise phase." },
  ],
  stream: true,
  temperature: 0.8,        // Creative but not wild
  // max_output_tokens: 2000, // Optional cap
});

for await (const event of stream) {
  switch (event.type) {
    case "response.output_text.delta":
      // event.delta contains the text fragment
      process.stdout.write(event.delta);
      break;
    case "response.completed":
      // event.response contains final response metadata + usage
      console.log("Tokens used:", event.response.usage);
      break;
    case "response.failed":
      console.error("Stream failed:", event.response);
      break;
  }
}
```

### Anti-Patterns to Avoid
- **Buffering the entire LLM response before processing:** Defeats the purpose of streaming. The pipeline must process sentences as they become available.
- **Running safety filter on individual tokens:** Tokens are fragments (e.g., "brea", "thing") — meaningless for content moderation. Always filter complete sentences.
- **Using Chat Completions API:** The project requirement specifies the Responses API. Chat Completions uses a different event structure (`chunk.choices[0]?.delta?.content`) and lacks the `instructions` parameter.
- **Splitting on every period without abbreviation handling:** "Dr. Smith" would incorrectly become two chunks. The abbreviation allowlist prevents this.
- **Ignoring the flush on stream end:** The last sentence may not end with punctuation. Always flush the buffer when the LLM stream completes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OpenAI API communication | HTTP client + SSE parser | `openai` SDK v6.22.0 | SDK handles auth, retries, streaming SSE parsing, typed events, error handling |
| Content safety filtering | Custom moderation | Existing `checkContentSafety()` from Phase 2 | Already implements three-layer pipeline (system prompt + OpenAI Moderation API + keyword blocklist + crisis detection) with guaranteed non-empty output |
| Fallback content | Generate fallbacks at runtime | `SAFETY_FALLBACKS` from `src/lib/safety/constants.ts` | Pre-written wellness-appropriate sentences that maintain session immersion |

**Key insight:** The sentence boundary chunker IS something to hand-roll here. The only npm option (`sbd`) is 5 years stale with no TypeScript types. Our requirements are narrow (split at `.!?` with abbreviation handling and min-length threshold) — a ~30-line function is simpler and more maintainable than an unmaintained dependency.

## Common Pitfalls

### Pitfall 1: Safety Filter Latency Blocking the Stream
**What goes wrong:** Each sentence must await `checkContentSafety()` which calls the OpenAI Moderation API (network round-trip). If the LLM generates sentences faster than moderation can process them, sentences queue up.
**Why it happens:** The moderation API adds ~100-300ms per call. During fast LLM generation, multiple sentences may complete before moderation returns.
**How to avoid:** The async generator pattern naturally handles this via backpressure — the next sentence is only pulled when the consumer is ready. For Phase 3, this is acceptable because the downstream consumer (Phase 4 TTS) also has its own latency. If needed later, concurrent moderation with ordering could be added.
**Warning signs:** Increasing delay between LLM generation and downstream delivery over the course of a session.

### Pitfall 2: Abbreviations Causing Premature Splits
**What goes wrong:** "Dr. Smith will guide your breathing." splits into "Dr." and "Smith will guide your breathing." — the first chunk is too short for natural TTS prosody.
**Why it happens:** Naive regex splits on every period.
**How to avoid:** Maintain an abbreviation allowlist. When a period follows a known abbreviation, skip the split. Combined with the minimum length threshold (~40 chars), most false splits are prevented.
**Warning signs:** Very short chunks (< 20 chars) appearing in output.

### Pitfall 3: Lost Final Sentence on Stream End
**What goes wrong:** The last LLM output may not end with sentence-ending punctuation (the model sometimes trails off or the stream is cut). This content sits in the buffer and is never emitted.
**Why it happens:** The sentence chunker only emits on punctuation boundaries.
**How to avoid:** Always flush the buffer when the LLM stream ends (the `for await` loop completes). Emit whatever remains if it has content, regardless of whether it ends with punctuation.
**Warning signs:** Sessions that feel abruptly cut off at the end.

### Pitfall 4: OpenAI SDK Instance Reuse in Serverless
**What goes wrong:** Creating a new `OpenAI()` client on every request wastes connection setup time.
**Why it happens:** Next.js API routes / server actions run in serverless context.
**How to avoid:** Create the OpenAI client as a module-level singleton (like `moderation.ts` already does: `const openai = new OpenAI()`). The SDK reads `OPENAI_API_KEY` from `process.env` automatically. Module-level singletons are reused across requests in the same serverless instance.
**Warning signs:** Unnecessary cold-start latency on streaming requests.

### Pitfall 5: Not Handling Stream Errors Gracefully
**What goes wrong:** Network errors, rate limits, or model errors mid-stream cause the async generator to throw, potentially crashing the session.
**Why it happens:** The `for await` loop throws if the underlying stream errors.
**How to avoid:** Wrap the LLM stream iteration in try/catch. On error, yield a graceful fallback message (e.g., from `SAFETY_FALLBACKS`) and signal the session to end cleanly rather than crash.
**Warning signs:** Unhandled promise rejections in logs during streaming.

### Pitfall 6: Moderation API Type Assertions
**What goes wrong:** The OpenAI SDK's types for `ModerationResult.categories` and `category_scores` require type assertions.
**Why it happens:** Known SDK typing limitation documented in Phase 2 decision: "OpenAI SDK Categories/CategoryScores require 'as unknown as Record' type assertion."
**How to avoid:** This is already handled in `src/lib/safety/moderation.ts`. Do not modify the moderation code — just call `checkContentSafety()` which wraps it correctly.
**Warning signs:** TypeScript compile errors when accessing moderation result fields directly.

## Code Examples

Verified patterns from official sources:

### OpenAI Responses API Streaming (Minimal)
```typescript
// Source: https://developers.openai.com/api/docs/guides/streaming-responses/
import OpenAI from "openai";

const client = new OpenAI();

const stream = await client.responses.create({
  model: "gpt-4.1-mini",
  instructions: "You are a calm wellness guide.",
  input: [{ role: "user", content: "Guide me through a breathing exercise." }],
  stream: true,
});

for await (const event of stream) {
  if (event.type === "response.output_text.delta") {
    // event.delta is the text fragment (string)
    process.stdout.write(event.delta);
  }
}
```

### Wiring Safety System Prompt into Instructions
```typescript
// Source: Phase 2 safety module + Responses API instructions parameter
import { SAFETY_SYSTEM_PROMPT } from "@/lib/safety";

const SESSION_PROMPT = `
You are a warm, present wellness guide leading a relaxation session.
Speak in second person. Use sensory language. Pace your words for
someone listening with eyes closed. Each response should be 3-5
sentences of guided content.
`;

const instructions = `${SAFETY_SYSTEM_PROMPT}\n\n${SESSION_PROMPT}`;

// This goes into: client.responses.create({ instructions, ... })
```

### Safety Filter Integration
```typescript
// Source: src/lib/safety/index.ts (Phase 2)
import { checkContentSafety, type SafetyCheckResult } from "@/lib/safety";

async function processSentence(sentence: string): Promise<string> {
  const result: SafetyCheckResult = await checkContentSafety(sentence);
  // result.output is ALWAYS non-empty:
  //   - If safe: original text
  //   - If blocked by moderation/keyword: random wellness fallback
  //   - If crisis detected: helpline resource message
  return result.output;
}
```

### Streaming Event Types Reference
```typescript
// Source: OpenAI API Reference - Responses streaming events
// Key events for text generation pipeline:

// Lifecycle events:
// "response.created"       — Stream started
// "response.in_progress"   — Generation in progress
// "response.completed"     — Stream finished (includes usage stats)
// "response.failed"        — Stream errored
// "response.incomplete"    — Stream cut short

// Text events (what we consume):
// "response.output_item.added"    — New output item created
// "response.content_part.added"   — Content part started
// "response.output_text.delta"    — Text fragment (event.delta: string)
// "response.output_text.done"     — Final text for this part
// "response.content_part.done"    — Content part finished
// "response.output_item.done"     — Output item finished

// Error events:
// "error"                         — Error occurred
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Chat Completions API with `messages[{role:"system"}]` | Responses API with `instructions` parameter | March 2025 | Cleaner system prompt handling, richer streaming events, built-in conversation state |
| `gpt-4o` as default model | `gpt-4.1-mini` available | April 2025 | Better instruction following at lower cost ($0.40/1M input vs $2.50/1M for 4o) |
| Manual SSE parsing | `for await (const event of stream)` in SDK | SDK v4.x+ | SDK handles SSE parsing, connection management, typed events |
| `.on()` event helpers | `for await` iteration | Responses API uses iteration, not `.on()` | Chat Completions has `.on()` helpers; Responses API uses AsyncIterable pattern |

**Deprecated/outdated:**
- `client.chat.completions.create()`: Still works but is the older API. Project requirement specifies Responses API.
- `sbd` npm package: Last updated 5 years ago. Hand-roll sentence splitting instead.

## Open Questions

1. **Model Selection**
   - What we know: `gpt-4.1-mini` is the current cost-efficient choice at $0.40/$1.60 per 1M tokens. `gpt-4o-mini` is even cheaper ($0.15/$0.60) but `gpt-4.1-mini` has better instruction following. Full-size models (4o, 4.1) cost 5-6x more.
   - What's unclear: Which model produces the best wellness session scripts in terms of warmth, pacing, and sensory language quality.
   - Recommendation: Default to `gpt-4.1-mini`, make model configurable via a constant or env var. Can A/B test later.

2. **Temperature Setting**
   - What we know: Range 0.0-2.0. Lower = more deterministic, higher = more creative. Wellness sessions benefit from variety but must stay coherent.
   - What's unclear: Optimal temperature for guided wellness content specifically.
   - Recommendation: Start at 0.8 (creative but controlled). Make configurable. Each session should feel fresh but not random.

3. **Max Output Tokens**
   - What we know: The Responses API supports `max_output_tokens`. Sessions will vary in length (10-30 min per SESS-03, Phase 7).
   - What's unclear: How many tokens a typical session phase generates, and whether a hard cap is needed vs. letting the session orchestrator (Phase 5) manage flow.
   - Recommendation: Do not set a hard cap in Phase 3. Let Phase 5's session orchestrator control generation length via prompt instructions and stop signals. Set a generous safety cap (e.g., 4096) to prevent runaway generation.

4. **Concurrent Safety Moderation**
   - What we know: The moderation API adds ~100-300ms per call. Sequential processing means each sentence blocks the next.
   - What's unclear: Whether this latency is noticeable in practice given TTS processing time downstream.
   - Recommendation: Start with sequential (simpler). Measure actual latency. Add concurrent moderation with ordering only if measurably slow.

## Sources

### Primary (HIGH confidence)
- [OpenAI Responses API Streaming Guide](https://developers.openai.com/api/docs/guides/streaming-responses/) — Streaming setup, event types, Node.js SDK examples
- [OpenAI Responses API Reference](https://developers.openai.com/api/reference/resources/responses/methods/create/) — `instructions`, `input`, `stream`, `temperature`, `max_output_tokens` parameters
- [OpenAI Responses API Streaming Events](https://developers.openai.com/api/reference/resources/responses/streaming-events) — All 53 event types, data structures
- [OpenAI Node SDK GitHub](https://github.com/openai/openai-node) — `client.responses.create()` with `stream: true`, `for await` iteration pattern
- [OpenAI TypeScript Blog](https://blog.robino.dev/posts/openai-responses-api) — Verified TypeScript examples of Responses API streaming with event type checking
- [OpenAI Community - Streaming Events Guide](https://community.openai.com/t/responses-api-streaming-the-simple-guide-to-events/1363122) — Detailed event lifecycle, data structures, `response.output_text.delta` structure

### Secondary (MEDIUM confidence)
- [Deepgram TTS Text Chunking](https://developers.deepgram.com/docs/tts-text-chunking) — Sentence-based chunking strategy for TTS, min chunk sizes (50-100 chars for voice assistants)
- [OpenAI Pricing](https://developers.openai.com/api/docs/pricing) — gpt-4.1-mini at $0.40/$1.60 per 1M tokens, gpt-4o at $2.50/$10.00
- [sbd npm package](https://www.npmjs.com/package/sbd) — v1.0.19, last published 5 years ago, no TypeScript types

### Tertiary (LOW confidence)
- Temperature recommendations (0.8 for creative content): Based on general best practices, not wellness-specific testing. Needs validation through experimentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — OpenAI SDK already installed, Responses API well-documented, event structure verified across multiple official sources
- Architecture: HIGH — Async generator pipeline is a standard TypeScript pattern, safety integration uses existing Phase 2 code with documented API contract
- Pitfalls: HIGH — Safety filter latency and abbreviation handling are well-documented concerns in TTS pipeline literature; stream error handling is standard practice
- Sentence chunking: MEDIUM — Hand-rolled approach is simpler than dependency but the regex + abbreviation allowlist needs testing with real LLM output
- Model/temperature selection: LOW — No wellness-specific benchmarks available; recommendations are reasonable defaults that need experimentation

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (30 days — OpenAI API is stable, patterns well-established)
