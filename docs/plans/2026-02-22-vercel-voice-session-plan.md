# Vercel Voice Session Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace WebSocket-based voice sessions with streaming REST APIs so the app works on Vercel serverless.

**Architecture:** Client-orchestrated sessions using 4 stateless API routes (start, generate, tts, complete). The client drives the 5-phase FSM, calling `/api/session/generate` for streaming text per phase and `/api/session/tts` for per-sentence audio. Pause/resume is purely client-side.

**Tech Stack:** Next.js 16 App Router, React 19, OpenAI streaming, ElevenLabs TTS streaming, Upstash Redis, Vitest

---

### Task 1: Create `/api/session/start` route

**Files:**
- Create: `src/app/api/session/start/route.ts`

**Step 1: Write the route**

```ts
// src/app/api/session/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionBudgets } from "@/lib/session/phase-config";
import { setSessionState } from "@/lib/session-store";
import { SESSION_PHASES } from "@/lib/session/phase-machine";

const VALID_LENGTHS = [10, 15, 20, 30];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const sessionLength =
      body.sessionLength && VALID_LENGTHS.includes(body.sessionLength)
        ? body.sessionLength
        : 15;

    const sessionId = crypto.randomUUID();
    const phaseBudgets = getSessionBudgets(sessionLength);

    // Serialize budgets as Record<SessionPhase, number> for Redis
    const budgetValues: Record<string, number> = {};
    for (const p of SESSION_PHASES) {
      budgetValues[p] = phaseBudgets[p].sentenceBudget;
    }

    await setSessionState(sessionId, {
      userId: "anonymous", // TODO: extract from auth session
      createdAt: Date.now(),
      ageVerified: true,
      tosAccepted: true,
      sensoryConsentGiven: body.sensoryConsent ?? true,
      aiDisclosureShown: true,
      currentPhase: SESSION_PHASES[0],
      phaseStartedAt: Date.now(),
      sentencesInPhase: 0,
      totalSentences: 0,
      previousResponseId: null,
      phaseBudgets: budgetValues as any,
      character: body.character ?? "Thea",
      sessionLengthMinutes: sessionLength,
    });

    return NextResponse.json({
      sessionId,
      phaseConfig: phaseBudgets,
    });
  } catch (error) {
    console.error("[session/start] Error:", error);
    return NextResponse.json(
      { error: "Failed to start session" },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to `src/app/api/session/start/route.ts`

**Step 3: Commit**

```bash
git add src/app/api/session/start/route.ts
git commit -m "feat: add /api/session/start route for session initialization"
```

---

### Task 2: Create `/api/session/generate` route (SSE streaming)

**Files:**
- Create: `src/app/api/session/generate/route.ts`

**Step 1: Write the route**

This is the core route. It receives the current phase context, calls the 3-stage LLM pipeline (streamLlmTokens -> chunkBySentence -> filterSafety), and streams sentences as SSE events.

```ts
// src/app/api/session/generate/route.ts
import { NextRequest } from "next/server";
import { SESSION_PHASES, type SessionPhase } from "@/lib/session/phase-machine";
import { getSessionBudgets } from "@/lib/session/phase-config";
import { buildPhaseInstructions, TRANSITION_HINTS } from "@/lib/session/phase-prompts";
import { MOOD_PROMPTS } from "@/lib/session/mood-prompts";
import { buildCharacterPrompt } from "@/lib/llm/prompts";
import {
  streamLlmTokens,
  chunkBySentence,
  filterSafety,
} from "@/lib/llm/generate-session";

const VALID_PHASES = new Set<string>(SESSION_PHASES);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      phase,
      sessionLength = 15,
      mood = "selvsikker",
      character = "Thea",
      previousResponseId,
      sentencesSoFar = 0,
      isWindDown = false,
    } = body;

    if (!phase || !VALID_PHASES.has(phase)) {
      return new Response(JSON.stringify({ error: "Invalid phase" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const phaseBudgets = getSessionBudgets(sessionLength);
    const budget = phaseBudgets[phase as SessionPhase];
    const moodContext = MOOD_PROMPTS[mood] ?? MOOD_PROMPTS["selvsikker"];
    const characterPrompt = buildCharacterPrompt(character);

    // Build instructions based on whether this is main or wind-down call
    const hint = isWindDown ? (TRANSITION_HINTS[phase as SessionPhase] || undefined) : undefined;
    const instructions = buildPhaseInstructions(
      phase as SessionPhase,
      hint,
      moodContext,
      characterPrompt
    );

    const maxSentences = isWindDown
      ? budget.sentenceBudget - sentencesSoFar
      : budget.windDownAt - sentencesSoFar;

    const userMessage = sentencesSoFar === 0 && !previousResponseId
      ? "Begin the session."
      : `Continue. The session is now entering the ${phase} phase.`;

    let capturedResponseId: string | null = null;

    const tokens = streamLlmTokens("", {
      instructions,
      previousResponseId: previousResponseId ?? undefined,
      store: true,
      userMessage,
      onResponseId: (id) => {
        capturedResponseId = id;
      },
    });

    const sentences = chunkBySentence(tokens);
    const safeSentences = filterSafety(sentences);

    // Create SSE stream
    const encoder = new TextEncoder();
    let sentenceIndex = sentencesSoFar;
    let sentenceCount = 0;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const sentence of safeSentences) {
            if (sentenceCount >= maxSentences) break;

            const event = {
              sentence,
              index: sentenceIndex,
              responseId: capturedResponseId,
            };

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
            );

            sentenceIndex++;
            sentenceCount++;
          }

          // Send done event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                totalSentences: sentenceIndex,
                responseId: capturedResponseId,
              })}\n\n`
            )
          );
          controller.close();
        } catch (error) {
          console.error("[session/generate] Stream error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Stream error" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[session/generate] Error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to `src/app/api/session/generate/route.ts`

**Step 3: Commit**

```bash
git add src/app/api/session/generate/route.ts
git commit -m "feat: add /api/session/generate route with SSE streaming"
```

---

### Task 3: Create `/api/session/tts` route (binary audio stream)

**Files:**
- Create: `src/app/api/session/tts/route.ts`

**Step 1: Write the route**

```ts
// src/app/api/session/tts/route.ts
import { NextRequest } from "next/server";
import { synthesizeSentence } from "@/lib/tts/tts-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voiceId, previousText } = body;

    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of synthesizeSentence(text, {
            voiceId,
            previousText: previousText?.slice(-1000),
          })) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (error) {
          console.error("[session/tts] Stream error:", error);
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[session/tts] Error:", error);
    return new Response(JSON.stringify({ error: "TTS failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to `src/app/api/session/tts/route.ts`

**Step 3: Commit**

```bash
git add src/app/api/session/tts/route.ts
git commit -m "feat: add /api/session/tts route for streaming audio"
```

---

### Task 4: Create `/api/session/complete` route

**Files:**
- Create: `src/app/api/session/complete/route.ts`

**Step 1: Write the route**

```ts
// src/app/api/session/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { deleteSessionState } from "@/lib/session-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    // Clean up Redis session state
    await deleteSessionState(sessionId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[session/complete] Error:", error);
    return NextResponse.json(
      { error: "Failed to complete session" },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/app/api/session/complete/route.ts
git commit -m "feat: add /api/session/complete route for session cleanup"
```

---

### Task 5: Create `useSessionOrchestrator` hook

This is the largest task. The hook replaces `useSessionWebSocket` and drives the entire session from the client side.

**Files:**
- Create: `src/hooks/use-session-orchestrator.ts`

**Step 1: Write the hook**

```ts
// src/hooks/use-session-orchestrator.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAudioQueue } from "./use-audio-queue";
import {
  SESSION_PHASES,
  getNextPhase,
  getPhaseIndex,
  type SessionPhase,
} from "@/lib/session/phase-machine";
import type { PhaseConfig } from "@/lib/session/phase-config";

type PhaseConfigMap = Record<SessionPhase, PhaseConfig>;

interface OrchestratorState {
  isConnected: boolean;
  sessionId: string | null;
  currentPhase: string | null;
  sessionEnded: boolean;
  error: string | null;
}

/**
 * Client-side session orchestrator replacing useSessionWebSocket.
 *
 * Drives the 5-phase session loop via REST APIs:
 * - POST /api/session/start -> session init
 * - POST /api/session/generate -> SSE text streaming per phase
 * - POST /api/session/tts -> binary audio per sentence
 * - POST /api/session/complete -> cleanup
 *
 * Returns the same interface as useSessionWebSocket for drop-in replacement.
 */
export function useSessionOrchestrator() {
  const [state, setState] = useState<OrchestratorState>({
    isConnected: false,
    sessionId: null,
    currentPhase: null,
    sessionEnded: false,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  const isPausedRef = useRef(false);
  const resumeResolveRef = useRef<(() => void) | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const previousTextRef = useRef("");

  const {
    initQueue,
    enqueue,
    pause: pauseAudio,
    resume: resumeAudio,
    stop: stopAudio,
    audioContext,
    voiceGain,
    ambientGain,
    isPlaying,
    isPaused,
    currentCaption,
  } = useAudioQueue();

  // Fallback text for when TTS fails
  const [fallbackText, setFallbackText] = useState("");

  /**
   * Wait while paused. Returns false if aborted during pause.
   */
  const waitIfPaused = useCallback(async (signal: AbortSignal): Promise<boolean> => {
    while (isPausedRef.current && !signal.aborted) {
      await new Promise<void>((resolve) => {
        resumeResolveRef.current = resolve;
      });
    }
    return !signal.aborted;
  }, []);

  /**
   * Fetch TTS audio for a sentence and enqueue for playback.
   */
  const fetchAndPlayTts = useCallback(
    async (text: string, voiceId: string | undefined, signal: AbortSignal) => {
      try {
        const response = await fetch("/api/session/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            voiceId,
            previousText: previousTextRef.current.slice(-1000),
          }),
          signal,
        });

        if (!response.ok || !response.body) {
          console.warn("[orchestrator] TTS request failed, showing fallback text");
          setFallbackText(text);
          setTimeout(() => setFallbackText(""), 4000);
          return;
        }

        // Read the entire audio response into a single ArrayBuffer
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let totalLength = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          totalLength += value.byteLength;
        }

        if (totalLength === 0) {
          setFallbackText(text);
          setTimeout(() => setFallbackText(""), 4000);
          return;
        }

        // Combine into single ArrayBuffer for decodeAudioData
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.byteLength;
        }

        await enqueue(combined.buffer as ArrayBuffer, text);
        previousTextRef.current += " " + text;
      } catch (error) {
        if (signal.aborted) return;
        console.error("[orchestrator] TTS error:", error);
        setFallbackText(text);
        setTimeout(() => setFallbackText(""), 4000);
      }
    },
    [enqueue]
  );

  /**
   * Read SSE stream from /api/session/generate and process sentences.
   * Returns { totalSentences, responseId } from the done event.
   */
  const streamPhase = useCallback(
    async (
      options: {
        phase: SessionPhase;
        sessionLength: number;
        mood: string;
        character: string;
        previousResponseId: string | null;
        sentencesSoFar: number;
        isWindDown: boolean;
        voiceId: string | undefined;
      },
      signal: AbortSignal
    ): Promise<{ totalSentences: number; responseId: string | null }> => {
      const response = await fetch("/api/session/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: options.phase,
          sessionLength: options.sessionLength,
          mood: options.mood,
          character: options.character,
          previousResponseId: options.previousResponseId,
          sentencesSoFar: options.sentencesSoFar,
          isWindDown: options.isWindDown,
        }),
        signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("Generate request failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let lastResponseId: string | null = null;
      let lastTotalSentences = options.sentencesSoFar;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (!data) continue;

          try {
            const event = JSON.parse(data);

            if (event.error) {
              console.error("[orchestrator] Generate error:", event.error);
              continue;
            }

            if (event.done) {
              lastTotalSentences = event.totalSentences;
              lastResponseId = event.responseId;
              continue;
            }

            // Got a sentence - wait if paused
            const canContinue = await waitIfPaused(signal);
            if (!canContinue) break;

            // Fetch TTS and play
            await fetchAndPlayTts(event.sentence, options.voiceId, signal);
            lastResponseId = event.responseId;
            lastTotalSentences = event.index + 1;
          } catch {
            // Skip malformed JSON
          }
        }
      }

      return { totalSentences: lastTotalSentences, responseId: lastResponseId };
    },
    [waitIfPaused, fetchAndPlayTts]
  );

  /**
   * Main session loop. Called after /api/session/start succeeds.
   */
  const runSession = useCallback(
    async (
      sessionId: string,
      phaseConfig: PhaseConfigMap,
      options: {
        character: string;
        sessionLength: number;
        mood: string;
        voiceId: string | undefined;
      },
      signal: AbortSignal
    ) => {
      let phase: SessionPhase = SESSION_PHASES[0];
      let previousResponseId: string | null = null;
      let totalSentences = 0;

      try {
        while (!signal.aborted) {
          const budget = phaseConfig[phase];

          // Emit phase start
          setState((s) => ({
            ...s,
            currentPhase: phase,
          }));

          // Main content call
          const mainResult = await streamPhase(
            {
              phase,
              sessionLength: options.sessionLength,
              mood: options.mood,
              character: options.character,
              previousResponseId,
              sentencesSoFar: totalSentences,
              isWindDown: false,
              voiceId: options.voiceId,
            },
            signal
          );

          if (signal.aborted) break;
          previousResponseId = mainResult.responseId;
          const sentencesAfterMain = mainResult.totalSentences - totalSentences;

          // Wind-down call if needed
          if (sentencesAfterMain < budget.sentenceBudget && sentencesAfterMain >= budget.windDownAt) {
            const windDownResult = await streamPhase(
              {
                phase,
                sessionLength: options.sessionLength,
                mood: options.mood,
                character: options.character,
                previousResponseId,
                sentencesSoFar: mainResult.totalSentences,
                isWindDown: true,
                voiceId: options.voiceId,
              },
              signal
            );

            if (signal.aborted) break;
            previousResponseId = windDownResult.responseId;
            totalSentences = windDownResult.totalSentences;
          } else {
            totalSentences = mainResult.totalSentences;
          }

          // Phase transition
          const nextPhase = getNextPhase(phase);
          if (nextPhase === null) {
            // Session complete
            break;
          }

          phase = nextPhase;
        }

        // Complete session
        await fetch("/api/session/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        }).catch(() => {});

        setState((s) => ({
          ...s,
          sessionEnded: true,
          isConnected: false,
          currentPhase: null,
        }));
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("[orchestrator] Session error:", error);
        setState((s) => ({
          ...s,
          error: "Session error",
        }));
      }
    },
    [streamPhase]
  );

  /**
   * Initialize AudioContext and start the session.
   * MUST be called inside a user gesture handler.
   */
  const connect = useCallback(() => {
    initQueue();
    setState((s) => ({ ...s, isConnected: true, error: null }));
  }, [initQueue]);

  /**
   * Start the session after connect(). Calls /api/session/start
   * and then runs the main session loop.
   */
  const startSession = useCallback(
    async (options?: {
      prompt?: string;
      sessionLength?: number;
      mood?: string;
      voiceId?: string;
      character?: string;
    }) => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/session/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            character: options?.character ?? "Thea",
            sessionLength: options?.sessionLength ?? 15,
            mood: options?.mood ?? "selvsikker",
            voiceId: options?.voiceId,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          setState((s) => ({ ...s, error: "Could not start session" }));
          return;
        }

        const { sessionId, phaseConfig } = await response.json();
        sessionIdRef.current = sessionId;
        setState((s) => ({ ...s, sessionId }));

        // Run the session loop (non-blocking)
        runSession(
          sessionId,
          phaseConfig,
          {
            character: options?.character ?? "Thea",
            sessionLength: options?.sessionLength ?? 15,
            mood: options?.mood ?? "selvsikker",
            voiceId: options?.voiceId,
          },
          controller.signal
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("[orchestrator] Start error:", error);
        setState((s) => ({ ...s, error: "Could not start session" }));
      }
    },
    [runSession]
  );

  /** Pause session (audio + orchestration loop). */
  const pause = useCallback(() => {
    isPausedRef.current = true;
    pauseAudio();
  }, [pauseAudio]);

  /** Resume session. */
  const resume = useCallback(() => {
    isPausedRef.current = false;
    resumeAudio();
    if (resumeResolveRef.current) {
      resumeResolveRef.current();
      resumeResolveRef.current = null;
    }
  }, [resumeAudio]);

  /** End session and clean up. */
  const endSession = useCallback(() => {
    abortRef.current?.abort();

    if (sessionIdRef.current) {
      fetch("/api/session/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current }),
      }).catch(() => {});
    }

    stopAudio();
    setState((s) => ({
      ...s,
      sessionEnded: true,
      isConnected: false,
      currentPhase: null,
    }));
  }, [stopAudio]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      stopAudio();
    };
  }, [stopAudio]);

  return {
    connect,
    startSession,
    pause,
    resume,
    endSession,
    isConnected: state.isConnected,
    isPlaying,
    isPaused,
    currentText: currentCaption || fallbackText,
    sessionId: state.sessionId,
    currentPhase: state.currentPhase,
    sessionEnded: state.sessionEnded,
    audioContext,
    voiceGain,
    ambientGain,
    error: state.error,
  };
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add src/hooks/use-session-orchestrator.ts
git commit -m "feat: add useSessionOrchestrator hook (REST-based session driver)"
```

---

### Task 6: Update SessionScreen to use new hook

**Files:**
- Modify: `src/components/session/session-screen.tsx:5` (import change)
- Modify: `src/components/session/session-screen.tsx:34` (hook call change)

**Step 1: Update imports and hook usage**

In `src/components/session/session-screen.tsx`:

Replace line 5:
```ts
import { useSessionWebSocket } from "@/hooks/use-session-ws";
```
With:
```ts
import { useSessionOrchestrator } from "@/hooks/use-session-orchestrator";
```

Replace line 34 (the hook call):
```ts
} = useSessionWebSocket();
```
With:
```ts
} = useSessionOrchestrator();
```

The return value interface is identical, so no other changes needed.

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/session/session-screen.tsx
git commit -m "feat: switch SessionScreen from WebSocket to REST orchestrator"
```

---

### Task 7: Remove next-ws and WebSocket code

**Files:**
- Delete: `src/app/api/session/ws/route.ts`
- Delete: `src/lib/ws/session-handler.ts`
- Delete: `src/lib/ws/message-types.ts`
- Delete: `src/hooks/use-session-ws.ts`
- Modify: `package.json` (remove next-ws, ws, @types/ws)

**Step 1: Delete WebSocket files**

```bash
rm src/app/api/session/ws/route.ts
rm src/lib/ws/session-handler.ts
rm src/lib/ws/message-types.ts
rm src/hooks/use-session-ws.ts
rmdir src/lib/ws
rmdir src/app/api/session/ws
```

**Step 2: Remove next-ws from package.json**

In `package.json`:

Remove from `dependencies`:
- `"next-ws": "^2.1.16"`
- `"ws": "^8.19.0"`

Remove from `devDependencies`:
- `"@types/ws": "^8.18.1"`

Remove from `scripts`:
- `"prepare": "next-ws patch"`

**Step 3: Reinstall dependencies**

Run: `npm install`
Expected: Clean install without next-ws patch

**Step 4: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors. If there are stale imports referencing `@/lib/ws/*` or `use-session-ws`, fix them.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove next-ws, WebSocket handler, and old session hook"
```

---

### Task 8: Verify build and smoke test

**Step 1: Full build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 2: Run existing tests**

Run: `npx vitest run`
Expected: All existing tests pass

**Step 3: Local smoke test**

Run: `npm run dev`

1. Open http://localhost:3000/session
2. Complete PreSessionFlow (character, mood, voice, length)
3. Verify "Kobler til..." transitions to active session
4. Verify audio plays
5. Verify pause/resume works
6. Verify session ends properly and shows PostSessionScreen

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address build/test issues from REST migration"
```

---

### Task 9: Deploy and verify on Vercel

**Step 1: Push to trigger Vercel deploy**

Run: `git push`
Expected: Vercel builds and deploys successfully (no more `next-ws patch` in build)

**Step 2: Verify on production**

1. Open the Vercel URL
2. Navigate to /session
3. Complete setup flow
4. Verify voice session works (text + audio streaming)
5. Verify pause/resume
6. Verify clean session end

**Step 3: Commit any production fixes if needed**
