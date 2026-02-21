# Phase 4: TTS & Audio Streaming - Research

**Researched:** 2026-02-21
**Domain:** ElevenLabs TTS integration, WebSocket gateway, streaming audio pipeline, client-side audio playback
**Confidence:** MEDIUM-HIGH

## Summary

Phase 4 connects the Phase 3 text generation pipeline (`generateSession` async generator) to ElevenLabs TTS, wraps it in a WebSocket gateway for real-time bidirectional communication, and delivers gap-free audio to the browser via a double-buffer playback queue. This is the highest-risk implementation in the product -- it is the hot path where latency directly impacts user experience.

The core architecture is a **cascading pipeline**: as `generateSession` yields each safe sentence, a TTS service converts it to audio via ElevenLabs' HTTP streaming endpoint, and those audio chunks flow through a WebSocket to the client's playback buffer. The LLM generates sentence N+1 while TTS synthesizes sentence N, achieving pipeline parallelism that targets <2 seconds to first audio.

The key architectural decisions are: (1) use ElevenLabs' HTTP streaming API (`textToSpeech.stream()`) per sentence rather than ElevenLabs' WebSocket input-streaming API (simpler, each sentence is a complete unit from the Phase 3 pipeline), (2) use the `next-ws` package to add WebSocket support directly in Next.js App Router routes (avoids separate server process), (3) use `eleven_flash_v2_5` model for ~75ms TTFB with acceptable voice quality, and (4) use MP3 output format with Web Audio API `decodeAudioData` for gap-free playback via scheduled `AudioBufferSourceNode` chaining.

**Primary recommendation:** Build a TTS service that consumes `generateSession`'s async generator, calls ElevenLabs `textToSpeech.stream()` per sentence with `previous_text`/`next_text` for prosody continuity, and pipes audio chunks through a `next-ws` WebSocket route to a client-side `AudioPlaybackQueue` using Web Audio API.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VOIC-03 | ElevenLabs TTS converts text chunks to audio with warm, natural voice quality | Use `@elevenlabs/elevenlabs-js` SDK v2.36.0 with `textToSpeech.stream()`. Select a warm meditation/wellness voice from ElevenLabs Voice Library (categories: meditation, soothing, warm, calm). Use `eleven_flash_v2_5` model for low latency with good quality. Voice settings: stability ~0.7, similarity_boost ~0.75 for consistent warm tone. |
| VOIC-04 | Cascading pipeline delivers first audio to user within 2 seconds of session start | Pipeline parallelism: LLM streams first sentence (~0.5-1s) + ElevenLabs TTS on first sentence (~75ms TTFB with Flash model) + WebSocket delivery (~10ms) + client decode (~50ms) = ~0.6-1.2s theoretical. Use `optimizeStreamingLatency: 3` on first request for fastest TTFB. Keep first sentence short via prompt engineering. |
| VOIC-05 | Audio streams to client via WebSocket with double-buffer playback queue for gap-free listening | Use `next-ws` for WebSocket in App Router. Binary WebSocket frames for audio. Client-side `AudioPlaybackQueue` using Web Audio API: `decodeAudioData` each chunk, schedule playback with `AudioBufferSourceNode.start(nextPlayTime)` for gap-free chaining. Receive queue buffers incoming chunks; play queue feeds AudioContext. |
| INFR-06 | WebSocket gateway for real-time audio streaming to client | `next-ws` v2.1.16 with `ws` peer dependency. Exports `SOCKET` handler from App Router route. Supports binary data natively. Handles connection lifecycle (open, message, close). NOT deployable on Vercel (serverless limitation) -- requires server-based hosting (Fly.io, Railway, Docker). JSON control messages + binary audio frames over same connection. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@elevenlabs/elevenlabs-js` | 2.36.0 | ElevenLabs TTS SDK | Official SDK with TypeScript types, `textToSpeech.stream()` returns `ReadableStream<Uint8Array>`, automatic retries with exponential backoff, 240s default timeout. Supports all models and output formats. |
| `next-ws` | 2.1.16 | WebSocket support in Next.js App Router | Enables `SOCKET` handler export in route files. Uses `ws` library underneath. Patches Next.js to handle WebSocket upgrade requests. 206 dependents, actively maintained. App Router native. |
| `ws` | latest | WebSocket library (peer dep of next-ws) | The standard Node.js WebSocket library. Required peer dependency for next-ws. Handles binary frames natively. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Web Audio API (browser built-in) | N/A | Client-side audio decode + playback | Always -- `AudioContext.decodeAudioData()` decodes MP3 chunks, `AudioBufferSourceNode` for scheduled gap-free playback. No external library needed. |
| `@upstash/ratelimit` | latest | Rate-limit TTS API calls | Protect against TTS cost explosion. Each ElevenLabs call costs money (~$0.20 per 1K chars). Rate-limit per user per minute. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `next-ws` | Separate Express/Fastify WebSocket server | Avoids patching Next.js but doubles deployment complexity. Two processes to manage. For v1, `next-ws` is simpler. Consider separating if scaling beyond ~1K concurrent sessions. |
| `next-ws` | Next.js Route Handler with Server-Sent Events (SSE) | SSE is unidirectional (server -> client only). Works on Vercel. But loses bidirectional control messages (pause, resume, end session) and would need a separate mechanism for client-to-server communication. WebSocket is the right tool for this use case. |
| ElevenLabs HTTP streaming | ElevenLabs WebSocket input-streaming API | The WS input-streaming API (`stream-input` endpoint) is designed for progressive text input where text arrives word-by-word. Our pipeline produces complete sentences from `generateSession`, making the HTTP streaming endpoint simpler and more predictable. The WS API adds complexity (connection management, chunk_length_schedule tuning) without clear benefit when input text is already sentence-sized. |
| `eleven_flash_v2_5` | `eleven_multilingual_v2` | Multilingual v2 has higher voice quality and emotional depth but higher latency (~250-400ms TTFB vs ~75ms). For a 2-second TTFA target, Flash is safer. Can A/B test later. |
| `eleven_flash_v2_5` | `eleven_v3` | v3 has highest emotional range but "not suitable for real-time or conversational use cases" per ElevenLabs docs. Variable consistency and higher latency. Not recommended for streaming. |
| Web Audio API | MediaSource Extensions (MSE) | MSE with `SourceBuffer.appendBuffer()` and sequence mode can also achieve gap-free playback. But MSE is designed for media element playback (`<audio>`/`<video>`) and adds complexity (MP3 padding removal, timestamp offsets). Web Audio API with `decodeAudioData` + scheduled `AudioBufferSourceNode` is more straightforward for our use case and gives better control over timing. |
| MP3 output format | PCM output format | PCM has zero decode overhead and zero compression latency. But PCM data is ~10x larger than MP3, increasing WebSocket bandwidth significantly. For a mobile-first product on variable connections, MP3 compression is worth the tiny decode time (~5-10ms). Use `mp3_44100_128` for quality or `mp3_22050_32` for bandwidth-sensitive scenarios. |

**Installation:**
```bash
npm install @elevenlabs/elevenlabs-js next-ws ws
npm install -D @types/ws
```

**Post-install setup (next-ws patching):**
Add to `package.json` scripts:
```json
{
  "scripts": {
    "prepare": "next-ws patch"
  }
}
```
Then run `npm run prepare` or reinstall dependencies to apply the patch.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── api/
│       └── session/
│           └── ws/
│               └── route.ts        # WebSocket SOCKET handler (next-ws)
├── lib/
│   ├── tts/
│   │   ├── elevenlabs-client.ts    # ElevenLabs SDK singleton + config
│   │   ├── tts-service.ts          # TTS streaming service (sentence -> audio chunks)
│   │   ├── audio-pipeline.ts       # Full pipeline: generateSession -> TTS -> audio chunks
│   │   └── index.ts                # Barrel exports
│   └── ws/
│       ├── message-types.ts        # WebSocket message type definitions (discriminated union)
│       ├── session-handler.ts      # WebSocket session lifecycle (connect, stream, disconnect)
│       └── index.ts                # Barrel exports
├── hooks/
│   ├── use-audio-queue.ts          # Client-side audio playback queue (Web Audio API)
│   └── use-session-ws.ts           # Client-side WebSocket connection management
└── types/
    └── ws-messages.ts              # Shared message types (if needed by both client + server)
```

### Pattern 1: TTS Service (Sentence -> Audio Chunks)

**What:** A service that takes a sentence string and yields audio chunks as an async generator, wrapping ElevenLabs' `textToSpeech.stream()`.
**When to use:** Called by the audio pipeline for each sentence yielded by `generateSession`.

```typescript
// Source: ElevenLabs JS SDK docs + official API reference
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const elevenlabs = new ElevenLabsClient();
// API key defaults to process.env.ELEVENLABS_API_KEY

const DEFAULT_VOICE_ID = "TO_BE_SELECTED"; // Warm wellness voice
const DEFAULT_MODEL = "eleven_flash_v2_5";

export async function* synthesizeSentence(
  text: string,
  options?: {
    voiceId?: string;
    previousText?: string;
    nextText?: string;
  }
): AsyncGenerator<Uint8Array> {
  const audioStream = await elevenlabs.textToSpeech.stream(
    options?.voiceId ?? DEFAULT_VOICE_ID,
    {
      text,
      modelId: DEFAULT_MODEL,
      outputFormat: "mp3_44100_128",
      optimizeStreamingLatency: 3,
      previousText: options?.previousText,
      nextText: options?.nextText,
    }
  );

  for await (const chunk of audioStream) {
    yield chunk;
  }
}
```

### Pattern 2: Audio Pipeline (generateSession -> TTS -> WebSocket)

**What:** The full cascading pipeline that connects the Phase 3 text generator to TTS and streams audio to a WebSocket client. This is the core orchestration function.
**When to use:** Called when a client connects via WebSocket and starts a session.

```typescript
// Cascading pipeline: text generation -> TTS -> WebSocket
import { generateSession } from "@/lib/llm";
import { synthesizeSentence } from "@/lib/tts";
import type { WebSocket } from "ws";

export async function streamSessionAudio(
  ws: WebSocket,
  sessionPrompt: string
): Promise<void> {
  let previousText = "";

  for await (const sentence of generateSession(sessionPrompt)) {
    // Send text event (for captions/debugging)
    ws.send(JSON.stringify({ type: "text", data: sentence }));

    // Stream TTS audio for this sentence
    for await (const audioChunk of synthesizeSentence(sentence, {
      previousText: previousText.slice(-1000), // Last 1000 chars for context
    })) {
      // Send binary audio frame
      ws.send(audioChunk);
    }

    previousText += " " + sentence;
  }

  // Signal end of stream
  ws.send(JSON.stringify({ type: "session_end" }));
}
```

### Pattern 3: WebSocket Route Handler (next-ws)

**What:** The App Router WebSocket endpoint that handles client connections.
**When to use:** Single entry point for all session WebSocket connections.

```typescript
// app/api/session/ws/route.ts
// Source: next-ws documentation

export function SOCKET(
  client: import("ws").WebSocket,
  request: import("next/server").NextRequest
) {
  console.log("Client connected");

  client.on("message", async (message) => {
    const data = JSON.parse(message.toString());

    if (data.type === "start_session") {
      await streamSessionAudio(client, data.prompt);
    }

    if (data.type === "pause") {
      // Handle pause (stop generating, client pauses playback)
    }

    if (data.type === "end") {
      client.close();
    }
  });

  client.on("close", () => {
    console.log("Client disconnected");
    // Cleanup: abort any in-progress generation
  });
}
```

### Pattern 4: Client Audio Playback Queue (Web Audio API)

**What:** Double-buffer queue that decodes incoming MP3 chunks and schedules them for gap-free playback.
**When to use:** Always for client-side audio playback from WebSocket stream.

```typescript
// Source: Web Audio API (MDN) + architecture research
class AudioPlaybackQueue {
  private audioContext: AudioContext;
  private queue: AudioBuffer[] = [];
  private nextPlayTime = 0;
  private isPlaying = false;

  constructor() {
    this.audioContext = new AudioContext();
  }

  async enqueue(audioData: ArrayBuffer): Promise<void> {
    const audioBuffer = await this.audioContext.decodeAudioData(
      audioData.slice(0) // decodeAudioData detaches the buffer
    );
    this.queue.push(audioBuffer);
    if (!this.isPlaying) {
      this.playNext();
    }
  }

  private playNext(): void {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }
    this.isPlaying = true;
    const buffer = this.queue.shift()!;
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    // Schedule at exact end of previous buffer for gap-free playback
    const startTime = Math.max(
      this.audioContext.currentTime,
      this.nextPlayTime
    );
    source.start(startTime);
    this.nextPlayTime = startTime + buffer.duration;
    source.onended = () => this.playNext();
  }

  pause(): void {
    this.audioContext.suspend();
  }

  resume(): void {
    this.audioContext.resume();
  }
}
```

### Pattern 5: WebSocket Message Protocol

**What:** Discriminated union for type-safe WebSocket messages.
**When to use:** All WebSocket communication between client and server.

```typescript
// Shared message types
// Server -> Client
type ServerMessage =
  | { type: "text"; data: string }           // Caption/transcript of current sentence
  | { type: "audio"; }                        // Binary frame follows (handled separately)
  | { type: "session_start"; sessionId: string }
  | { type: "session_end" }
  | { type: "error"; message: string };

// Client -> Server
type ClientMessage =
  | { type: "start_session"; prompt: string }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "end" };

// Binary frames are audio data (no JSON wrapper -- sent as raw binary)
```

### Anti-Patterns to Avoid

- **Using ElevenLabs WebSocket input-streaming for pre-chunked text:** The `stream-input` WebSocket API is optimized for word-by-word text arrival. Our pipeline already produces complete sentences. Using the HTTP streaming endpoint per sentence is simpler and avoids managing ElevenLabs WebSocket connection state, `chunk_length_schedule`, and `auto_mode` complexity.

- **Waiting for full TTS response before sending to client:** Send each audio chunk to the WebSocket as it arrives from ElevenLabs. Do not buffer the entire sentence's audio server-side. The client's playback queue handles buffering.

- **Using `AudioContext.decodeAudioData` on the main thread for large chunks:** `decodeAudioData` is already async and runs on a separate thread. However, if chunks are very large, consider limiting chunk size. ElevenLabs streaming naturally produces small chunks (~1-5KB each).

- **Creating a new `AudioContext` per audio chunk:** Create ONE `AudioContext` on user interaction (required by browser autoplay policy) and reuse it for the entire session.

- **Deploying WebSocket routes to Vercel:** Vercel Functions are serverless and do not support persistent WebSocket connections. The `next-ws` package explicitly states it is "not suitable for serverless platforms like Vercel." Deploy to a server-based platform (Fly.io, Railway, Docker on any VPS).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TTS synthesis | Custom TTS model or raw API calls | `@elevenlabs/elevenlabs-js` SDK `textToSpeech.stream()` | SDK handles authentication, retries (2 retries with exponential backoff), streaming, abort signals, and timeout (240s). Raw `fetch` calls miss retry logic and type safety. |
| WebSocket in Next.js App Router | Custom `http.createServer` + manual upgrade handling | `next-ws` with `SOCKET` handler export | `next-ws` patches Next.js to handle upgrade requests natively. Manual approaches require a custom server file that is incompatible with Next.js standalone mode. |
| Audio playback queue | Manual `HTMLAudioElement` management with URL.createObjectURL | Web Audio API `AudioBufferSourceNode` scheduling | `HTMLAudioElement` creates audible gaps between segments. Web Audio API's precise `start(time)` scheduling enables gap-free playback. The `AudioBufferSourceNode.start(nextPlayTime)` pattern is the standard solution. |
| MP3 silence trimming | Custom MP3 frame parser for gap removal | Web Audio API `decodeAudioData` + `AudioBufferSourceNode` scheduling | `decodeAudioData` handles MP3 padding internally. Scheduled playback with calculated `nextPlayTime` avoids gaps without manual frame manipulation. If gaps persist, MediaSource Extensions with `sequence` mode is the fallback, but this is unlikely with the Web Audio approach. |
| Audio format conversion | Manual PCM-to-MP3 encoding | ElevenLabs `outputFormat` parameter | Request the format you need directly from ElevenLabs. No server-side transcoding needed. |
| WebSocket message routing | Manual if/else chains on message types | Discriminated union types with switch statement | TypeScript discriminated unions provide exhaustive type checking. The compiler catches missing message type handlers. |

**Key insight:** The ElevenLabs SDK and Web Audio API together handle the two hardest parts of this phase (TTS streaming and gap-free playback). The value-add of custom code is in the pipeline orchestration -- connecting `generateSession` to TTS to WebSocket to playback queue.

## Common Pitfalls

### Pitfall 1: Browser Autoplay Policy Blocking Audio
**What goes wrong:** `AudioContext` is created on page load, but browsers require user interaction (click/tap) before audio can play. The first audio chunk arrives, `decodeAudioData` succeeds, but `source.start()` silently fails or the `AudioContext` is in `suspended` state.
**Why it happens:** All major browsers enforce autoplay policies. Creating `AudioContext` outside a user gesture puts it in `suspended` state.
**How to avoid:** Create `AudioContext` inside a click/tap handler (the "Start Session" button). Check `audioContext.state === 'suspended'` and call `audioContext.resume()` before first playback. Wrap initialization in a user-interaction event.
**Warning signs:** Audio works in development (where browsers are often more permissive) but fails in production or on mobile devices.

### Pitfall 2: ElevenLabs API Key Exposure in Client
**What goes wrong:** ElevenLabs API key is included in client-side code or sent via WebSocket messages, allowing users to extract and abuse it.
**Why it happens:** Developer shortcuts or confusion about where the TTS call happens.
**How to avoid:** ElevenLabs calls happen ONLY server-side. The WebSocket carries audio bytes (output), never API keys. The `ELEVENLABS_API_KEY` environment variable is read server-side only.
**Warning signs:** API key appears in browser network tab, client bundle, or WebSocket message payloads.

### Pitfall 3: `decodeAudioData` Detaches ArrayBuffer
**What goes wrong:** Calling `audioContext.decodeAudioData(buffer)` transfers ownership of the `ArrayBuffer`, making it zero-length. If you try to use the buffer again (e.g., for logging or retry), it's empty.
**Why it happens:** `decodeAudioData` uses transferable objects for performance -- the buffer is moved to the decode thread.
**How to avoid:** Call `.slice(0)` on the ArrayBuffer before passing to `decodeAudioData` if you need to retain the original data. For playback-only use cases, this is not necessary.
**Warning signs:** Mysterious zero-length buffers in debugging, or "ArrayBuffer has been detached" errors.

### Pitfall 4: WebSocket Connection Drop During Long Sessions
**What goes wrong:** WebSocket disconnects mid-session (network switch, sleep/wake, mobile background) and the session audio stops. User must restart the entire session.
**Why it happens:** Mobile networks are unreliable. Users lock phones, switch WiFi/cellular, or move between coverage areas. Default WebSocket inactivity timeouts close idle connections.
**How to avoid:** Implement ping/pong heartbeat (every 30 seconds). On disconnect, attempt automatic reconnection with exponential backoff (3 attempts). Store session generation state in Redis so a reconnected client can resume from where it left off (Phase 5 concern, but the WebSocket handler should be designed for it now). The `ws` library supports `ping()` natively.
**Warning signs:** High WebSocket close rates, user complaints about sessions "cutting out."

### Pitfall 5: TTS Cost Explosion from Uncontrolled Generation
**What goes wrong:** A session generates unlimited text, and every sentence costs ElevenLabs API credits. Malicious or buggy clients could drain the TTS budget.
**Why it happens:** No rate limiting or session-length caps on TTS calls. The LLM can generate indefinitely.
**How to avoid:** Rate-limit TTS calls per user with `@upstash/ratelimit`. Set a maximum character count per session (e.g., 10,000 chars for a 30-min session). Track cumulative TTS characters in session state (Redis). Abort generation when limit is reached.
**Warning signs:** Unexpectedly high ElevenLabs bill. Sessions lasting hours. Single users consuming disproportionate TTS credits.

### Pitfall 6: Audio Gaps Between Sentences Due to Sequential TTS Calls
**What goes wrong:** There's a noticeable silence gap between sentences because the client finishes playing sentence N's audio before sentence N+1's audio arrives.
**Why it happens:** Each sentence requires a separate TTS API call. If the TTS call for sentence N+1 hasn't started or completed by the time sentence N finishes playing, there's a gap.
**How to avoid:** (1) Start TTS for sentence N+1 as soon as sentence N's text is ready, not after sentence N's audio finishes. The async generator pipeline naturally handles this -- `for await` moves to the next sentence immediately. (2) Client-side: buffer 2-3 sentences of audio before starting playback. (3) Use `previous_text` parameter to maintain prosody continuity across sentences. (4) Pre-generate first sentence content via prompt engineering ("Begin with a warm, brief greeting").
**Warning signs:** Users report "choppy" or "stuttering" audio. Playback queue frequently empties.

## Code Examples

### Complete Server-Side TTS Service

```typescript
// src/lib/tts/elevenlabs-client.ts
// Source: ElevenLabs SDK docs (https://github.com/elevenlabs/elevenlabs-js)
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

// Module-level singleton (matches openai pattern in src/lib/llm/generate-session.ts)
export const elevenlabs = new ElevenLabsClient();
// Reads ELEVENLABS_API_KEY from process.env automatically

export const TTS_CONFIG = {
  voiceId: "VOICE_ID_TO_BE_SELECTED", // Select from ElevenLabs meditation/soothing category
  modelId: "eleven_flash_v2_5",       // ~75ms TTFB, 32 languages, 50% lower cost
  outputFormat: "mp3_44100_128" as const,
  optimizeStreamingLatency: 3,         // Strong latency optimization
  voiceSettings: {
    stability: 0.7,          // Higher = more consistent, lower = more expressive
    similarityBoost: 0.75,   // Voice matching fidelity
    style: 0.3,              // Low style for calm, consistent delivery
    speed: 0.95,             // Slightly slower for wellness pacing
  },
} as const;
```

### Complete WebSocket Route Handler

```typescript
// src/app/api/session/ws/route.ts
// Source: next-ws docs (https://github.com/apteryxxyz/next-ws)
import type { WebSocket } from "ws";

export function SOCKET(
  client: WebSocket,
  request: import("next/server").NextRequest
) {
  // TODO: Authenticate via session cookie or token from request

  client.binaryType = "arraybuffer";

  client.on("message", async (raw) => {
    try {
      const message = JSON.parse(raw.toString());

      switch (message.type) {
        case "start_session":
          // Begin streaming pipeline
          await streamSessionAudio(client, message.prompt);
          break;
        case "pause":
          // Signal pipeline to pause generation
          break;
        case "end":
          client.close(1000, "Session ended by client");
          break;
      }
    } catch (err) {
      client.send(JSON.stringify({
        type: "error",
        message: "Invalid message format",
      }));
    }
  });

  client.on("close", (code, reason) => {
    // Cleanup: abort any in-progress pipelines
    // AbortController signal propagates to ElevenLabs SDK
  });
}
```

### Complete Client-Side WebSocket + Audio Hook

```typescript
// src/hooks/use-session-ws.ts
// Source: Web Audio API (MDN), WebSocket API
"use client";

import { useRef, useCallback, useState, useEffect } from "react";

export function useSessionWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const audioQueueRef = useRef<AudioPlaybackQueue | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const connect = useCallback(() => {
    // AudioContext MUST be created in user gesture handler
    audioQueueRef.current = new AudioPlaybackQueue();

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/session/ws`);
    ws.binaryType = "arraybuffer";

    ws.onopen = () => setIsConnected(true);

    ws.onmessage = async (event) => {
      if (event.data instanceof ArrayBuffer) {
        // Binary frame: audio data
        await audioQueueRef.current?.enqueue(event.data);
        if (!isPlaying) setIsPlaying(true);
      } else {
        // Text frame: JSON control message
        const message = JSON.parse(event.data);
        if (message.type === "session_end") {
          setIsPlaying(false);
        }
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsPlaying(false);
    };

    wsRef.current = ws;
  }, []);

  const startSession = useCallback((prompt: string) => {
    wsRef.current?.send(JSON.stringify({
      type: "start_session",
      prompt,
    }));
  }, []);

  const pause = useCallback(() => {
    audioQueueRef.current?.pause();
    wsRef.current?.send(JSON.stringify({ type: "pause" }));
  }, []);

  const resume = useCallback(() => {
    audioQueueRef.current?.resume();
    wsRef.current?.send(JSON.stringify({ type: "resume" }));
  }, []);

  const end = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "end" }));
    wsRef.current?.close();
  }, []);

  return { connect, startSession, pause, resume, end, isConnected, isPlaying };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ElevenLabs `eleven_multilingual_v2` as primary | `eleven_flash_v2_5` for real-time, `eleven_v3` for quality | Flash v2.5: mid-2025, v3: late 2025 | Flash achieves ~75ms TTFB at 50% lower cost. v3 has highest emotional range but too slow for streaming. Use Flash for real-time, v3 for pre-generation. |
| ElevenLabs Python SDK dominant | `@elevenlabs/elevenlabs-js` v2.36.0 mature | 2025 | JS SDK now feature-complete with TypeScript types, streaming support, abort signals. No need for Python sidecar. |
| Custom WebSocket server for Next.js | `next-ws` v2.1.16 | 2024-2025 | Patches Next.js to handle WebSocket upgrades in App Router routes. Avoids custom server.js complexity. Still requires server-based hosting (not Vercel). |
| `HTMLAudioElement` + `URL.createObjectURL` | Web Audio API `AudioBufferSourceNode` scheduling | Stable since 2020+ | `HTMLAudioElement` approach creates audible gaps between segments. Web Audio API precise scheduling (`source.start(nextPlayTime)`) is the standard for gap-free streaming playback. |
| `optimize_streaming_latency` query param (0-4) | `optimizeStreamingLatency` in SDK request body | SDK v2.x | Same functionality, cleaner API. Values 0-4, where 3 = max optimization, 4 = max + text normalizer off. |

**Deprecated/outdated:**
- `elevenlabs` npm package (unofficial by FelixWaweru): Use `@elevenlabs/elevenlabs-js` (official)
- `eleven_turbo_v2`: Superseded by `eleven_flash_v2_5` (lower latency, same cost)
- `eleven_flash_v2`: English-only. Use `eleven_flash_v2_5` for 32 languages

## Deployment Constraint: Vercel Incompatibility

**Critical finding:** The existing project plans to deploy on Vercel (per STACK.md and Phase 1 research). WebSocket connections are NOT supported on Vercel Functions -- they are serverless and stateless. The `next-ws` package explicitly states: "Not suitable for serverless platforms like Vercel."

**Options:**

1. **Deploy to server-based platform instead of Vercel** (Recommended for v1)
   - Fly.io, Railway, or Docker on any VPS
   - Full WebSocket support, persistent connections
   - `next start` or standalone mode
   - Loses Vercel's automatic preview deployments and edge optimizations

2. **Hybrid: Vercel for pages, separate WebSocket server**
   - Static pages and API routes on Vercel
   - WebSocket server on Fly.io/Railway
   - Adds deployment complexity (two services, CORS, separate domains)
   - Better long-term if scaling separately

3. **SSE fallback instead of WebSocket** (Compromise)
   - Use Next.js Route Handler with `ReadableStream` for audio streaming (works on Vercel)
   - Server-to-client only (no bidirectional control messages via same channel)
   - Client sends control messages via regular HTTP POST requests
   - Simpler deployment, but loses real-time bidirectional communication elegance
   - Audio still streams, but pause/resume needs separate REST endpoints

**Recommendation:** Option 1 for v1. Deploy the entire Next.js app to a server-based platform. WebSocket is the right abstraction for a real-time audio session (bidirectional: audio out, controls in). The Vercel migration can happen later if the WebSocket server is extracted (Option 2). Document the deployment target change as a Phase 4 decision.

## Open Questions

1. **ElevenLabs Voice ID Selection**
   - What we know: ElevenLabs has dedicated voice categories (meditation, soothing, warm, calm, gentle) with multiple options. The voice library has curated voices for wellness use cases.
   - What's unclear: The specific voice ID to use. This requires listening tests with real wellness script content.
   - Recommendation: Select 2-3 candidate voices from the meditation/soothing categories. Test with a 60-second wellness script sample. Lock the chosen voice ID in config. This is a product decision, not a code decision -- do it before building the TTS service.

2. **Deployment Platform Migration**
   - What we know: Vercel does not support WebSockets. The project was initially planned for Vercel deployment. `next-ws` requires server-based hosting.
   - What's unclear: Whether to switch entirely to a server-based platform (Option 1) or use a hybrid approach (Option 2).
   - Recommendation: Option 1 (full migration to server-based platform like Fly.io) for v1 simplicity. Document in STATE.md as a decision change.

3. **Audio Buffer Pre-fill Strategy**
   - What we know: The 2-second TTFA target is tight. Client-side buffering helps smooth playback but adds latency.
   - What's unclear: How many sentences of audio to buffer before starting playback. Zero buffering = lowest latency but risk of gaps. 2-3 sentence buffer = smoother but ~3-5 second delay.
   - Recommendation: Start playback immediately on first audio chunk (zero pre-buffer). The pipeline parallelism should keep chunks flowing. If gaps are detected in testing, add a 1-sentence pre-buffer. Make this configurable.

4. **AbortController Propagation**
   - What we know: Client can send "end" or "pause" messages. Server needs to abort in-progress LLM generation and TTS calls.
   - What's unclear: How to cleanly propagate abort signals through the async generator pipeline (`generateSession` -> TTS).
   - Recommendation: Pass an `AbortController.signal` to both `generateSession` (to abort LLM streaming) and `synthesizeSentence` (to abort ElevenLabs SDK call via its `abortSignal` option). Store the controller per-connection. On WebSocket close or "end" message, call `controller.abort()`.

5. **Character Limit Awareness**
   - What we know: `eleven_flash_v2_5` has a 40,000 character limit per request (~40 minutes of audio). Individual sentences from `generateSession` are typically 40-200 characters.
   - What's unclear: Whether the 40K limit applies per-request (sentence) or per-session.
   - Recommendation: The limit is per-request. Since we make one request per sentence, this is not a concern. Track cumulative characters per session for cost monitoring, not for API limits.

## Sources

### Primary (HIGH confidence)
- [ElevenLabs JS SDK v2.36.0](https://github.com/elevenlabs/elevenlabs-js) - Installation, streaming API, return types, TypeScript types
- [ElevenLabs Stream Speech API Reference](https://elevenlabs.io/docs/api-reference/text-to-speech/stream) - All parameters including `optimize_streaming_latency`, `output_format`, `previous_text`, `next_text`, voice settings
- [ElevenLabs WebSocket API Reference](https://elevenlabs.io/docs/api-reference/text-to-speech/v-1-text-to-speech-voice-id-stream-input) - WebSocket streaming protocol, `chunk_length_schedule`, `auto_mode`, bidirectional message format
- [ElevenLabs Models Documentation](https://elevenlabs.io/docs/overview/models) - Model comparison (Flash v2.5 ~75ms, Turbo v2.5 ~250ms, v3 highest quality), character limits, pricing
- [next-ws v2.1.16](https://github.com/apteryxxyz/next-ws) - Setup, `SOCKET` handler, patching process, limitations (not serverless), binary data handling
- [Web Audio API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) - `AudioContext`, `decodeAudioData`, `AudioBufferSourceNode`, scheduling
- [Media Source Extensions for Audio (web.dev)](https://web.dev/articles/mse-seamless-playback) - Gap-free playback with `appendWindowStart/End`, `timestampOffset`, sequence mode

### Secondary (MEDIUM confidence)
- [ElevenLabs Voice Library - Meditation](https://elevenlabs.io/voice-library/meditation) - Voice categories for wellness use cases
- [ElevenLabs Voice Library - Soothing](https://elevenlabs.io/voice-library/soothing) - Warm, nurturing voice options
- [DeepWiki elevenlabs-js Streaming](https://deepwiki.com/elevenlabs/elevenlabs-js/2.2-streaming-text-to-speech) - SDK source code analysis, method signatures, abort signal support
- [Audio Worklet Design Pattern (Chrome Developers)](https://developer.chrome.com/blog/audio-worklet-design-pattern/) - Ring buffer pattern for advanced audio processing
- [Vercel WebSocket Support FAQ](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections) - Confirms serverless limitation, recommends third-party solutions

### Tertiary (LOW confidence)
- [WebSocket Audio Streaming (GitHub community)](https://github.com/scottstensland/websockets-streaming-audio) - Double buffer queue reference, Web Worker pattern
- [audio-worklet-stream library](https://github.com/ain1084/audio-worklet-stream) - Timer-based and worker-based buffer writing strategies (reference only)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - ElevenLabs SDK v2.36.0 verified via npm/GitHub, `next-ws` v2.1.16 verified, Web Audio API is a stable browser standard
- Architecture: HIGH - Cascading pipeline pattern validated by architecture research doc, `generateSession` async generator interface confirmed by reading source code, `textToSpeech.stream()` return type confirmed as `ReadableStream<Uint8Array>`
- Pitfalls: MEDIUM-HIGH - Browser autoplay policy is well-documented, TTS cost modeling based on ElevenLabs published pricing, WebSocket disconnect handling is well-understood; specific gap-free playback tuning may require empirical testing
- Deployment constraint: HIGH - Vercel WebSocket incompatibility confirmed by both Vercel's own docs and `next-ws` documentation

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (ElevenLabs SDK moves fast; check for new models/features monthly)
