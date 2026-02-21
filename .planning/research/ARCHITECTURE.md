# Architecture Research

**Domain:** Voice-guided AI wellness system (LLM + TTS streaming)
**Researched:** 2026-02-21
**Confidence:** MEDIUM-HIGH

## Standard Architecture

### System Overview

```
                          CLIENT (Browser)
  ┌──────────────────────────────────────────────────────────┐
  │  ┌──────────────┐  ┌──────────┐  ┌───────────────────┐  │
  │  │  React UI    │  │  Audio   │  │  Session State    │  │
  │  │  (Controls,  │  │  Player  │  │  (Client Mirror)  │  │
  │  │   Visuals)   │  │  Queue   │  │                   │  │
  │  └──────┬───────┘  └────▲─────┘  └────────▲──────────┘  │
  │         │               │                  │             │
  │         └───────┬───────┴──────────────────┘             │
  │                 │  WebSocket (bidirectional)              │
  └─────────────────┼────────────────────────────────────────┘
                    │
  ==================│============================================
                    │         SERVER
  ┌─────────────────┼────────────────────────────────────────┐
  │                 ▼                                        │
  │  ┌──────────────────────────┐                            │
  │  │   WebSocket Gateway      │                            │
  │  │   (Connection Manager)   │                            │
  │  └──────────┬───────────────┘                            │
  │             │                                            │
  │  ┌──────────▼───────────────┐  ┌──────────────────────┐  │
  │  │   Session Orchestrator   │──│   Session Store      │  │
  │  │   (Phase State Machine)  │  │   (Redis)            │  │
  │  └──────────┬───────────────┘  └──────────────────────┘  │
  │             │                                            │
  │  ┌──────────▼───────────────┐                            │
  │  │   Safety Filter Layer    │                            │
  │  │   (Input + Output)       │                            │
  │  └──────────┬───────────────┘                            │
  │             │                                            │
  │  ┌──────────▼───────────────┐                            │
  │  │   LLM Service            │───── OpenAI / Anthropic   │
  │  │   (Prompt Assembly +     │      Chat Completions API  │
  │  │    Streaming Consumer)   │      (streaming)           │
  │  └──────────┬───────────────┘                            │
  │             │  (sentence chunks)                         │
  │  ┌──────────▼───────────────┐                            │
  │  │   TTS Service            │───── ElevenLabs / OpenAI   │
  │  │   (Text-to-Audio         │      TTS API               │
  │  │    Streaming Pipeline)   │      (streaming)           │
  │  └──────────┬───────────────┘                            │
  │             │  (audio chunks)                            │
  │             ▼                                            │
  │     [Back through WebSocket to client]                   │
  └──────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **React UI** | Session controls (start/pause/end), visual feedback (phase indicator, waveform), consent gates, theme rendering | Next.js App Router with React, pink wellness theme (#F8C8DC, #D63384, #2B2B2B) |
| **Audio Player Queue** | Receives audio chunks over WebSocket, buffers them, plays seamlessly in sequence, handles pause/resume | Web Audio API with AudioContext, double-buffer queue pattern |
| **WebSocket Gateway** | Manages persistent connections, routes messages between client and server pipeline, handles reconnection | ws library on Node.js, or Socket.IO for fallback transport |
| **Session Orchestrator** | Central coordinator -- manages phase transitions, assembles LLM context, orchestrates the generate-speak pipeline per turn | Custom state machine in TypeScript, the "brain" of the server |
| **Session Store** | Persists session state (current phase, conversation history, user preferences, consent status) across requests | Redis with TTL-based expiry, JSON serialization |
| **Safety Filter Layer** | Validates input intent before LLM, scans output before TTS, enforces content boundaries | Rule-based filters + OpenAI Moderation API, runs on both input and output |
| **LLM Service** | Assembles system prompt + phase context + history, calls chat completions API with streaming, chunks response into sentences | OpenAI SDK with streaming, sentence boundary detection |
| **TTS Service** | Converts sentence-sized text chunks to audio, streams audio bytes back as they are generated | ElevenLabs WebSocket API or OpenAI TTS streaming endpoint |

## Recommended Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Landing / consent gate
│   ├── session/
│   │   └── page.tsx            # Main session experience
│   └── api/
│       └── session/
│           ├── route.ts        # REST: create/end session
│           └── ws/
│               └── route.ts    # WebSocket upgrade endpoint
├── components/
│   ├── session/
│   │   ├── SessionPlayer.tsx   # Audio playback + visual waveform
│   │   ├── PhaseIndicator.tsx  # Shows current phase progress
│   │   ├── ConsentGate.tsx     # Age verification + consent flow
│   │   └── SessionControls.tsx # Play/pause/end buttons
│   └── ui/                     # Shared UI primitives (pink theme)
├── hooks/
│   ├── useWebSocket.ts         # WebSocket connection management
│   ├── useAudioQueue.ts        # Audio chunk buffering + playback
│   └── useSession.ts           # Client-side session state mirror
├── server/
│   ├── orchestrator/
│   │   ├── SessionOrchestrator.ts    # Main coordinator class
│   │   ├── PhaseStateMachine.ts      # FSM for 5-phase flow
│   │   └── phases/
│   │       ├── atmosphere.ts         # Phase 1: Atmosphere setting
│   │       ├── breathing.ts          # Phase 2: Breathing guidance
│   │       ├── sensory.ts            # Phase 3: Sensory awareness
│   │       ├── relaxation.ts         # Phase 4: Deep relaxation
│   │       └── resolution.ts         # Phase 5: Resolution/closing
│   ├── services/
│   │   ├── LLMService.ts            # Chat completions streaming
│   │   ├── TTSService.ts            # Text-to-speech streaming
│   │   └── SafetyService.ts         # Content filtering layer
│   ├── websocket/
│   │   ├── ConnectionManager.ts     # WebSocket lifecycle
│   │   └── MessageRouter.ts         # Message type dispatching
│   └── store/
│       ├── SessionStore.ts           # Redis session persistence
│       └── types.ts                  # Session state interfaces
├── lib/
│   ├── prompts/
│   │   ├── system.ts                 # Base system prompt
│   │   └── phases.ts                 # Phase-specific prompt additions
│   ├── safety/
│   │   ├── rules.ts                  # Rule-based content filters
│   │   └── classifier.ts            # ML-based content classification
│   └── audio/
│       ├── sentenceChunker.ts        # Splits LLM stream at sentence boundaries
│       └── audioFormat.ts            # Audio format constants + helpers
└── types/
    ├── session.ts                    # Session, Phase, Turn types
    ├── messages.ts                   # WebSocket message schemas
    └── safety.ts                     # Safety classification types
```

### Structure Rationale

- **`server/orchestrator/`**: The session orchestrator is the most complex server component. Isolating it with its own phase definitions makes the 5-phase flow explicitly visible and independently testable.
- **`server/services/`**: Each external API integration (LLM, TTS, Safety) gets its own service with a clean interface. This allows swapping providers (e.g., OpenAI TTS to ElevenLabs) without touching orchestration logic.
- **`lib/prompts/`**: System prompts are configuration, not code. Separating them makes prompt engineering iterative without touching service logic.
- **`hooks/`**: Client-side WebSocket, audio playback, and session state are distinct concerns that compose in the session page.
- **`server/store/`**: Session persistence is decoupled from session logic. Redis today, Postgres tomorrow if needed.

## Architectural Patterns

### Pattern 1: Cascading Pipeline (LLM streaming to TTS streaming)

**What:** The server streams text from the LLM, accumulates it into sentence-sized chunks at natural boundaries (periods, question marks, paragraph breaks), and feeds each chunk to the TTS service for audio generation. Audio chunks stream back to the client as they are produced. The LLM and TTS operate in an overlapping pipeline -- while the TTS synthesizes sentence N, the LLM is already generating sentence N+1.

**When to use:** This is the right architecture for this project. The user is primarily listening (not conversing back and forth), so we do not need sub-300ms response times. The cascading approach gives us full visibility into the text before it becomes audio (critical for safety filtering), control over which LLM and TTS providers we use, and significantly lower cost than the OpenAI Realtime API.

**Trade-offs:**
- PRO: Can filter/moderate text before TTS synthesis (essential for safety)
- PRO: Can swap LLM and TTS providers independently
- PRO: Full debug visibility -- you can log the text at every stage
- PRO: Cost: ~$0.02-0.04/min vs ~$0.10-0.20/min for Realtime API
- CON: Higher latency (1-3s to first audio vs ~500ms for Realtime)
- CON: More components to build and maintain

**Example:**
```typescript
// Sentence chunking from LLM stream
async function* chunkBySentence(
  llmStream: AsyncIterable<string>
): AsyncGenerator<string> {
  let buffer = '';
  for await (const token of llmStream) {
    buffer += token;
    // Emit at sentence boundaries
    const sentenceEnd = buffer.match(/[.!?]\s/);
    if (sentenceEnd && buffer.length > 40) {
      const idx = sentenceEnd.index! + 1;
      yield buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx);
    }
  }
  if (buffer.trim()) yield buffer.trim();
}

// Pipeline: LLM stream -> sentence chunks -> TTS -> audio chunks -> client
async function generateAndSpeak(session: Session, ws: WebSocket) {
  const llmStream = llmService.stream(session.buildPrompt());
  const sentences = chunkBySentence(llmStream);

  for await (const sentence of sentences) {
    // Safety check on text BEFORE sending to TTS
    const safe = await safetyService.check(sentence);
    if (!safe.passed) {
      sentence = safe.replacement; // Use safe fallback
    }
    // Stream TTS audio for this sentence
    for await (const audioChunk of ttsService.synthesize(sentence)) {
      ws.send(audioChunk); // Binary audio frame
    }
  }
}
```

### Pattern 2: Phase State Machine (Session Orchestration)

**What:** A finite state machine governs session progression through 5 phases. Each phase has: an entry condition, a system prompt modifier, a minimum/maximum duration, transition triggers, and an exit condition. The FSM is the single source of truth for "where are we in the session."

**When to use:** Always. Multi-phase guided sessions need explicit state management. Without it, the LLM drifts, phases blur together, and the session loses structure.

**Trade-offs:**
- PRO: Predictable session flow, easy to debug
- PRO: Phase-specific prompts keep the LLM focused
- PRO: Clear points for consent re-checks (before Phase 3: Sensory)
- CON: Rigid -- transitions need careful design to feel natural

**Example:**
```typescript
interface PhaseConfig {
  name: 'atmosphere' | 'breathing' | 'sensory' | 'relaxation' | 'resolution';
  systemPromptAddition: string;
  minDurationMs: number;
  maxDurationMs: number;
  transitionTrigger: (context: SessionContext) => boolean;
  requiresConsentGate: boolean;
}

const PHASES: PhaseConfig[] = [
  {
    name: 'atmosphere',
    systemPromptAddition: 'Set a calm, warm atmosphere. Greet the user...',
    minDurationMs: 60_000,      // 1 min minimum
    maxDurationMs: 180_000,     // 3 min maximum
    transitionTrigger: (ctx) => ctx.turnCount >= 2 && ctx.elapsed > ctx.phase.minDurationMs,
    requiresConsentGate: false,
  },
  {
    name: 'breathing',
    systemPromptAddition: 'Guide gentle breathing exercises...',
    minDurationMs: 120_000,
    maxDurationMs: 300_000,
    transitionTrigger: (ctx) => ctx.elapsed > ctx.phase.minDurationMs,
    requiresConsentGate: false,
  },
  {
    name: 'sensory',
    systemPromptAddition: 'Guide sensory awareness and body scan...',
    minDurationMs: 180_000,
    maxDurationMs: 600_000,
    transitionTrigger: (ctx) => ctx.elapsed > ctx.phase.minDurationMs,
    requiresConsentGate: true,  // Consent check before intimate content
  },
  // ... relaxation, resolution
];

class PhaseStateMachine {
  private currentIndex = 0;
  private phaseStartTime = Date.now();

  get current(): PhaseConfig { return PHASES[this.currentIndex]; }

  tryTransition(context: SessionContext): PhaseConfig | null {
    const phase = this.current;
    if (phase.transitionTrigger(context)) {
      if (this.currentIndex < PHASES.length - 1) {
        this.currentIndex++;
        this.phaseStartTime = Date.now();
        return this.current;
      }
    }
    return null; // Stay in current phase
  }
}
```

### Pattern 3: Double-Buffer Audio Queue (Client Playback)

**What:** The client maintains two buffer queues for audio playback. A "receive queue" accumulates incoming WebSocket audio chunks. A "play queue" feeds the Web Audio API. A background process continuously moves chunks from the receive queue to the play queue, staying ahead of playback. This prevents audio gaps caused by network jitter or WebSocket delays.

**When to use:** Always for streaming audio playback in the browser. Single-buffer approaches cause audible gaps.

**Trade-offs:**
- PRO: Smooth, gap-free playback
- PRO: Tolerates network jitter
- CON: Small added latency from buffering (50-200ms, acceptable for wellness content)

**Example:**
```typescript
class AudioPlaybackQueue {
  private audioContext: AudioContext;
  private queue: AudioBuffer[] = [];
  private nextPlayTime = 0;
  private isPlaying = false;

  constructor() {
    this.audioContext = new AudioContext();
  }

  async enqueue(audioData: ArrayBuffer) {
    const audioBuffer = await this.audioContext.decodeAudioData(audioData);
    this.queue.push(audioBuffer);
    if (!this.isPlaying) this.playNext();
  }

  private playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }
    this.isPlaying = true;
    const buffer = this.queue.shift()!;
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    const startTime = Math.max(
      this.audioContext.currentTime,
      this.nextPlayTime
    );
    source.start(startTime);
    this.nextPlayTime = startTime + buffer.duration;
    source.onended = () => this.playNext();
  }
}
```

## Data Flow

### Primary Flow: Session Turn (User listens to AI-guided content)

```
1. Client sends "next" or phase-advance message via WebSocket
       │
       ▼
2. WebSocket Gateway receives, routes to Session Orchestrator
       │
       ▼
3. Session Orchestrator:
   a. Loads session state from Redis (phase, history, preferences)
   b. Checks phase state machine -- should we transition?
   c. Assembles full prompt: system prompt + phase modifier + history
       │
       ▼
4. Safety Filter (Input): Validates the assembled prompt
   (Checks for prompt injection, ensures system prompt integrity)
       │
       ▼
5. LLM Service: Calls chat completions API with streaming
   Returns: AsyncIterable<string> of token chunks
       │
       ▼
6. Sentence Chunker: Accumulates tokens, emits at sentence boundaries
   Returns: AsyncIterable<string> of complete sentences
       │
       ▼
7. Safety Filter (Output): Checks each sentence before TTS
   (Content classification, wellness boundary enforcement)
       │
       ▼
8. TTS Service: Converts each sentence to audio stream
   Returns: AsyncIterable<ArrayBuffer> of audio chunks
       │
       ▼
9. WebSocket Gateway: Sends binary audio frames to client
       │
       ▼
10. Client Audio Queue: Buffers + plays audio seamlessly
```

### Secondary Flow: Session Lifecycle

```
Create Session:
  Client POST /api/session → Server creates session ID
  → Stores initial state in Redis (phase: atmosphere, history: [])
  → Returns session ID + WebSocket URL
  → Client opens WebSocket with session ID

Phase Transition:
  Orchestrator detects transition trigger
  → Updates Redis: { phase: nextPhase, phaseStartTime: now }
  → Sends phase_changed event to client via WebSocket
  → Client updates PhaseIndicator UI
  → If next phase requires consent gate → sends consent_required event
  → Client shows ConsentGate UI → User confirms → Client sends consent_granted
  → Orchestrator resumes generation in new phase

End Session:
  Client sends "end" or max duration reached
  → Orchestrator triggers resolution phase if not already there
  → After resolution audio completes → sends session_complete event
  → Redis session data expires (TTL) or is cleared immediately
  → WebSocket closed
```

### State Management

```
Server (Source of Truth):
  Redis Key: session:{sessionId}
  Value: {
    id: string,
    phase: 'atmosphere' | 'breathing' | 'sensory' | 'relaxation' | 'resolution',
    phaseStartedAt: timestamp,
    sessionStartedAt: timestamp,
    conversationHistory: Message[],     // Last N turns for LLM context
    consentStatus: {
      ageVerified: boolean,
      sensoryConsent: boolean,          // Explicit consent for Phase 3+
    },
    userPreferences: {
      voiceId: string,                  // Selected TTS voice
      sessionPace: 'gentle' | 'moderate',
    },
    turnCount: number,
    isActive: boolean,
  }
  TTL: 3600 (1 hour -- sessions auto-expire)

Client (Mirror / UI State):
  React state mirrors: phase, isPlaying, consentStatus
  Does NOT store conversation history (privacy)
  Does NOT make LLM/TTS decisions (server-authoritative)
```

### Key Data Flows

1. **Generate-Speak Pipeline:** LLM tokens -> sentence chunks -> safety filter -> TTS audio -> WebSocket -> client playback. This is the hot path and the most latency-sensitive. All steps overlap (pipeline parallelism).
2. **Phase Transition:** Orchestrator detects trigger -> updates Redis -> notifies client -> client updates UI. This is the control path. Transitions must feel smooth, not abrupt.
3. **Safety Interception:** Runs on every sentence between LLM output and TTS input. If a sentence fails the safety check, a pre-written safe fallback replaces it. The user never hears unsafe content because text is filtered before it becomes audio.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100 concurrent sessions | Single Node.js server, single Redis instance. WebSocket connections are lightweight. A single server can handle 100+ concurrent WebSocket connections easily. This is the starting point. |
| 100-1K concurrent sessions | The bottleneck is outbound API calls (LLM + TTS). Add connection pooling and request queuing for external APIs. Consider multiple Node.js processes (PM2 cluster or container replicas) behind a load balancer with sticky sessions for WebSocket affinity. Redis remains single instance. |
| 1K-10K concurrent sessions | External API rate limits become the real constraint. Introduce a request queue (Bull/BullMQ on Redis) to manage LLM/TTS API call rates. Consider TTS caching -- common phrases (breathing counts, greetings) can be pre-synthesized. Move to Redis Cluster for session store. Multiple server instances with proper WebSocket session affinity. |
| 10K+ concurrent sessions | At this scale, TTS cost dominates. Evaluate self-hosted TTS models (XTTS-v2, Piper) for common content. Consider pre-generating session segments for popular configurations. Geographic distribution with edge servers. This scale likely requires a dedicated infrastructure team. |

### Scaling Priorities

1. **First bottleneck: External API rate limits and cost.** LLM and TTS APIs have per-minute token/character limits. The LLM generates ~100-200 words per turn, and TTS converts all of it. At $0.015/1K chars for TTS, a 20-minute session costs ~$0.30-0.60 in TTS alone. Mitigation: cache common audio segments, batch TTS requests efficiently.
2. **Second bottleneck: WebSocket connection density.** Each session holds an open WebSocket for its duration (10-30 minutes). At 1K sessions, that is 1K persistent connections. Node.js handles this well natively, but you need sticky sessions behind a load balancer. Mitigation: use Redis pub/sub for cross-instance communication.

## Anti-Patterns

### Anti-Pattern 1: Using OpenAI Realtime API for a Listen-Only Experience

**What people do:** Reach for OpenAI's Realtime API because it is the "voice AI" solution, without considering the use case.
**Why it is wrong:** The Realtime API is optimized for bidirectional conversation (user speaks, AI responds with voice). This project is primarily listen-only: the AI speaks, the user mostly listens. The Realtime API costs 5-10x more ($0.10-0.20/min vs $0.02-0.04/min for cascading), locks you into OpenAI's TTS voices, and removes the ability to inspect/filter text before it becomes audio.
**Do this instead:** Use the cascading pipeline (LLM streaming -> sentence chunking -> TTS streaming). You get text visibility for safety filtering, provider flexibility, and dramatically lower cost.

### Anti-Pattern 2: Storing Full Session State in the Client

**What people do:** Keep conversation history, phase logic, and prompt assembly in the browser to avoid server complexity.
**Why it is wrong:** The system prompt contains safety constraints and the session structure. If the client controls prompt assembly, a user can modify/bypass safety filters via browser devtools. The server must be authoritative for safety-critical applications.
**Do this instead:** Server-authoritative architecture. The client is a dumb audio player with controls. All prompt assembly, safety filtering, and phase logic runs server-side. The client mirrors just enough state for UI rendering.

### Anti-Pattern 3: Waiting for Full LLM Response Before Starting TTS

**What people do:** Collect the entire LLM response, then send it all to TTS at once.
**Why it is wrong:** This serializes two slow operations. If the LLM takes 3 seconds and TTS takes 3 seconds, the user waits 6 seconds. With pipeline overlap, the user hears audio after ~1.5-2 seconds because TTS starts on the first sentence while the LLM is still generating.
**Do this instead:** Stream the LLM response, chunk at sentence boundaries, and pipeline TTS synthesis. The first audio reaches the client while later sentences are still being generated.

### Anti-Pattern 4: No Sentence Boundary Detection in LLM-to-TTS Pipeline

**What people do:** Send every few tokens to TTS as they arrive, or wait for very large chunks.
**Why it is wrong:** Too-small chunks produce choppy, unnatural audio with poor prosody (the TTS model needs enough context to intone properly). Too-large chunks add unnecessary latency. Neither approach yields natural-sounding speech.
**Do this instead:** Buffer LLM tokens and emit at sentence boundaries (`.` `!` `?` followed by whitespace) with a minimum chunk size of ~40 characters. This gives the TTS model enough context for natural prosody while keeping latency low.

### Anti-Pattern 5: Skipping Output Safety Filtering

**What people do:** Trust the system prompt to prevent all unsafe content and skip output scanning.
**Why it is wrong:** System prompts are not a security boundary. LLMs can be jailbroken, drift off-topic, or produce unexpected content despite strong system prompts. For a wellness product with intimate content, the gap between "acceptable wellness content" and "inappropriate content" is narrow and must be enforced programmatically.
**Do this instead:** Run every LLM output sentence through a safety classifier before TTS. Use a layered approach: keyword blocklist (fast, catches obvious violations) + OpenAI Moderation API or lightweight classifier (catches subtle violations). Replace unsafe sentences with pre-written safe alternatives so the session continues without interruption.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **OpenAI Chat Completions** | HTTPS streaming (SSE), server-to-server | Use `stream: true`. Accumulate tokens, chunk by sentence. Model: GPT-4o or Claude for quality. Keep system prompt under 2K tokens for latency. |
| **ElevenLabs TTS** (primary recommendation) | WebSocket streaming, server-to-server | Connect per-session or use connection pooling. Use `chunk_length_schedule` for optimal buffering. Output format: mp3 or pcm_16000 for low bandwidth. Turbo v2.5 model for lowest latency. |
| **OpenAI TTS** (alternative) | HTTPS streaming, server-to-server | Simpler integration (no WebSocket), `response_format: mp3`, `speed: 1.0`. Fewer voice options but lower complexity. Good enough for MVP. |
| **OpenAI Moderation API** | REST, server-to-server | Call per-sentence. Fast (~100ms). Free. Returns category scores for hate, self-harm, sexual, violence. Set custom thresholds for wellness content. |
| **Redis** | TCP, server-to-Redis | Session store. Use JSON serialization. Set TTL on all keys. Single instance is sufficient until 1K+ concurrent sessions. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Client <-> WebSocket Gateway | WebSocket (binary for audio, JSON for control messages) | Define message types: `session_start`, `phase_changed`, `consent_required`, `audio_chunk`, `session_end`. Use a discriminated union for type safety. |
| WebSocket Gateway <-> Session Orchestrator | Direct function call (same process) | The gateway deserializes messages and calls orchestrator methods. No need for inter-process communication at initial scale. |
| Session Orchestrator <-> LLM Service | Async iterator interface | `llmService.stream(prompt): AsyncIterable<string>`. The orchestrator does not know about OpenAI specifics -- the service abstracts the provider. |
| Session Orchestrator <-> TTS Service | Async iterator interface | `ttsService.synthesize(text): AsyncIterable<ArrayBuffer>`. Same abstraction pattern. Swap ElevenLabs for OpenAI TTS by implementing the same interface. |
| Session Orchestrator <-> Safety Service | Sync-style check | `safetyService.check(text): { passed: boolean, replacement?: string }`. Must be fast (<200ms). Runs inline in the pipeline. |
| Session Orchestrator <-> Session Store | Async CRUD | `store.get(id)`, `store.update(id, patch)`, `store.delete(id)`. Thin wrapper over Redis commands. |

## Build Order (Dependency Chain)

The following build order reflects component dependencies -- each layer requires the previous ones to exist.

```
Phase 1: Foundation
  ├── Session types + interfaces (types/)
  ├── Redis session store (server/store/)
  └── WebSocket gateway skeleton (server/websocket/)

Phase 2: Core Pipeline
  ├── LLM Service with streaming (server/services/LLMService.ts)
  ├── Sentence chunker (lib/audio/sentenceChunker.ts)
  ├── TTS Service with streaming (server/services/TTSService.ts)
  └── Pipeline integration: LLM -> chunk -> TTS -> WebSocket

Phase 3: Session Intelligence
  ├── Phase State Machine (server/orchestrator/PhaseStateMachine.ts)
  ├── Phase-specific prompts (lib/prompts/)
  ├── Session Orchestrator (server/orchestrator/SessionOrchestrator.ts)
  └── Session lifecycle (create, phase transitions, end)

Phase 4: Safety Layer
  ├── Safety Service (server/services/SafetyService.ts)
  ├── Rule-based filters (lib/safety/rules.ts)
  ├── Output classifier integration (lib/safety/classifier.ts)
  └── Consent gates (server-side enforcement)

Phase 5: Client Experience
  ├── Audio playback queue (hooks/useAudioQueue.ts)
  ├── WebSocket hook (hooks/useWebSocket.ts)
  ├── Session UI (components/session/)
  ├── Consent flow UI (components/session/ConsentGate.tsx)
  └── Pink wellness theme
```

**Why this order:**
- Phase 1 first because everything depends on types, storage, and transport.
- Phase 2 before Phase 3 because the pipeline must work before orchestration logic can drive it. You can test LLM-to-TTS streaming with hardcoded prompts.
- Phase 3 before Phase 4 because safety filtering inserts into an existing pipeline. You need the pipeline to exist before you can intercept it.
- Phase 4 before Phase 5 (or parallel) because the safety layer should be in place before real users interact. Client can be built in parallel with Phase 3-4 if needed.
- Phase 5 last because the UI is a consumer of everything above. It can be stubbed with mock audio during earlier phases.

## Sources

- [The voice AI stack for building agents in 2026 - AssemblyAI](https://www.assemblyai.com/blog/the-voice-ai-stack-for-building-agents) - MEDIUM confidence, ecosystem overview
- [Real-Time vs Turn-Based Voice Agent Architecture - Softcery](https://softcery.com/lab/ai-voice-agents-real-time-vs-turn-based-tts-stt-architecture) - MEDIUM confidence, architecture comparison
- [Keeping LLMs in Check: Safety Layers - RisingStack](https://blog.risingstack.com/llm-safety-layers/) - MEDIUM confidence, safety architecture patterns
- [ElevenLabs WebSocket TTS Documentation](https://elevenlabs.io/docs/api-reference/text-to-speech/v-1-text-to-speech-voice-id-stream-input) - HIGH confidence, official docs
- [OpenAI Chat Completions Streaming](https://platform.openai.com/docs/api-reference/chat) - HIGH confidence, official docs
- [OpenAI TTS API](https://platform.openai.com/docs/api-reference/audio/createSpeech) - HIGH confidence, official docs
- [OpenAI Realtime API Pricing](https://skywork.ai/blog/agent/openai-realtime-api-pricing-2025-cost-calculator/) - MEDIUM confidence, third-party analysis
- [Redis Session Management](https://redis.io/solutions/session-management/) - HIGH confidence, official docs
- [Web Audio API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) - HIGH confidence, official docs
- [WebSocket Audio Streaming Pattern](https://github.com/scottstensland/websockets-streaming-audio) - LOW confidence, community reference
- [Pipecat Voice Agent Framework](https://github.com/pipecat-ai/pipecat) - HIGH confidence, official repo
- [SSE Streaming LLM Responses in Next.js - Upstash](https://upstash.com/blog/sse-streaming-llm-responses) - MEDIUM confidence, tutorial
- [LLM Guardrails Best Practices - Datadog](https://www.datadoghq.com/blog/llm-guardrails-best-practices/) - MEDIUM confidence, industry guide

---
*Architecture research for: Voice-guided AI wellness system*
*Researched: 2026-02-21*
