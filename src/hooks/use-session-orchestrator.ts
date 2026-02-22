"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAudioQueue } from "./use-audio-queue";
import {
  SESSION_PHASES,
  getNextPhase,
  type SessionPhase,
} from "@/lib/session/phase-machine";
import type { PhaseConfig } from "@/lib/session/phase-config";

// ---------------------------------------------------------------------------
// useSessionOrchestrator -- REST/SSE + audio integration hook
// ---------------------------------------------------------------------------

/**
 * React hook that drives a multi-phase wellness session via REST APIs
 * (start, generate, tts, complete) instead of a WebSocket connection.
 *
 * The return value is intentionally identical to `useSessionWebSocket`
 * so that SessionScreen can do a drop-in replacement.
 *
 * Usage:
 * 1. User clicks "Start" -> call `connect()` (creates AudioContext in gesture)
 * 2. Once connected, call `startSession(options?)` to begin streaming
 * 3. Sentences are fetched via SSE, converted to audio via TTS, and enqueued
 * 4. Use `pause()`, `resume()`, `endSession()` for session lifecycle control
 */
export function useSessionOrchestrator() {
  // ---------------------------------------------------------------------------
  // React state (mirrors useSessionWebSocket return shape)
  // ---------------------------------------------------------------------------
  const [isConnected, setIsConnected] = useState(false);
  const [fallbackText, setFallbackText] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Refs for async loop coordination
  // ---------------------------------------------------------------------------
  const abortControllerRef = useRef<AbortController | null>(null);
  const isPausedRef = useRef(false);
  const resumeResolveRef = useRef<(() => void) | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  /** Serialise enqueue calls so audio decodes happen in sentence order. */
  const enqueueChainRef = useRef<Promise<void>>(Promise.resolve());
  /** Track whether the main loop is running to prevent double starts. */
  const isRunningRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Audio queue
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Pause gate -- blocks the async loop while paused
  // ---------------------------------------------------------------------------

  /**
   * Awaitable gate that resolves when the session is unpaused.
   * Called inside the main loop before processing each sentence.
   */
  const waitIfPaused = useCallback(async (signal: AbortSignal) => {
    while (isPausedRef.current && !signal.aborted) {
      await new Promise<void>((resolve) => {
        resumeResolveRef.current = resolve;
      });
    }
  }, []);

  // ---------------------------------------------------------------------------
  // SSE reader -- reads sentences from /api/session/generate
  // ---------------------------------------------------------------------------

  interface GenerateSentence {
    sentence: string;
    index: number;
    responseId?: string;
  }

  /**
   * Reads an SSE stream from /api/session/generate and yields sentences.
   * Stops early when `maxSentences` is reached or the stream ends.
   */
  async function* readGenerateStream(
    response: Response,
    maxSentences: number,
    signal: AbortSignal,
  ): AsyncGenerator<GenerateSentence> {
    const body = response.body;
    if (!body) return;

    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let sentenceCount = 0;

    try {
      while (!signal.aborted) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by double newlines, but each line ends with \n
        // and data lines look like: data: {...}\n\n
        // Split on newlines and process each line.
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(line.slice(6));

            if (data.error) {
              throw new Error(data.error);
            }

            if (data.done) {
              return; // Stream complete
            }

            if (data.sentence) {
              yield {
                sentence: data.sentence,
                index: data.index,
                responseId: data.responseId,
              };
              sentenceCount++;
              if (sentenceCount >= maxSentences) {
                return; // Reached limit
              }
            }
          } catch (parseErr) {
            // If it's our own thrown error, re-throw
            if (parseErr instanceof Error && parseErr.message !== "Unexpected end of JSON input") {
              throw parseErr;
            }
            // Otherwise skip malformed SSE lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // ---------------------------------------------------------------------------
  // TTS reader -- reads binary audio from /api/session/tts
  // ---------------------------------------------------------------------------

  /**
   * Fetches TTS audio for a single sentence and returns the combined ArrayBuffer.
   */
  async function fetchTtsAudio(
    text: string,
    voiceId: string | undefined,
    previousText: string | undefined,
    signal: AbortSignal,
  ): Promise<ArrayBuffer> {
    const response = await fetch("/api/session/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceId, previousText }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`TTS request failed: ${response.status}`);
    }

    const body = response.body;
    if (!body) {
      throw new Error("TTS response has no body");
    }

    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    let totalLength = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalLength += value.byteLength;
    }

    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return combined.buffer as ArrayBuffer;
  }

  // ---------------------------------------------------------------------------
  // Phase runner -- processes a single phase (main + wind-down)
  // ---------------------------------------------------------------------------

  async function runPhase(
    phase: SessionPhase,
    budget: PhaseConfig,
    sessionConfig: {
      sessionLength: number;
      mood?: string;
      character?: string;
      voiceId?: string;
    },
    state: {
      previousResponseId: string | null;
      previousText: string | undefined;
      sentencesInPhase: number;
    },
    signal: AbortSignal,
  ): Promise<{
    previousResponseId: string | null;
    previousText: string | undefined;
    sentencesInPhase: number;
  }> {
    let { previousResponseId, previousText, sentencesInPhase } = state;

    // --- Main content call (up to windDownAt sentences) ---
    const mainMaxSentences = Math.max(0, budget.windDownAt - sentencesInPhase);

    if (mainMaxSentences > 0 && !signal.aborted) {
      const mainResponse = await fetch("/api/session/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase,
          sessionLength: sessionConfig.sessionLength,
          mood: sessionConfig.mood,
          character: sessionConfig.character,
          previousResponseId,
          sentencesSoFar: sentencesInPhase,
          isWindDown: false,
        }),
        signal,
      });

      if (!mainResponse.ok) {
        throw new Error(`Generate request failed: ${mainResponse.status}`);
      }

      for await (const item of readGenerateStream(mainResponse, mainMaxSentences, signal)) {
        if (signal.aborted) break;

        // Wait if paused
        await waitIfPaused(signal);
        if (signal.aborted) break;

        if (item.responseId) {
          previousResponseId = item.responseId;
        }

        // Fetch TTS audio for this sentence
        try {
          const audioBuffer = await fetchTtsAudio(
            item.sentence,
            sessionConfig.voiceId,
            previousText,
            signal,
          );

          if (signal.aborted) break;

          // Chain enqueue so decodes are serialised in sentence order
          const caption = item.sentence;
          enqueueChainRef.current = enqueueChainRef.current.then(() =>
            enqueue(audioBuffer, caption),
          );
        } catch (ttsErr) {
          if (signal.aborted) break;
          // TTS failed -- show text as fallback for 4 seconds
          console.warn("[orchestrator] TTS failed for sentence, showing fallback:", ttsErr);
          setFallbackText(item.sentence);
          setTimeout(() => setFallbackText(""), 4000);
        }

        previousText = item.sentence;
        sentencesInPhase++;
      }
    }

    // --- Wind-down call (windDownAt to sentenceBudget) ---
    if (
      !signal.aborted &&
      sentencesInPhase >= budget.windDownAt &&
      sentencesInPhase < budget.sentenceBudget
    ) {
      const remaining = budget.sentenceBudget - sentencesInPhase;

      if (remaining > 0) {
        const windDownResponse = await fetch("/api/session/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phase,
            sessionLength: sessionConfig.sessionLength,
            mood: sessionConfig.mood,
            character: sessionConfig.character,
            previousResponseId,
            sentencesSoFar: sentencesInPhase,
            isWindDown: true,
          }),
          signal,
        });

        if (!windDownResponse.ok) {
          throw new Error(`Generate wind-down request failed: ${windDownResponse.status}`);
        }

        for await (const item of readGenerateStream(windDownResponse, remaining, signal)) {
          if (signal.aborted) break;

          // Wait if paused
          await waitIfPaused(signal);
          if (signal.aborted) break;

          if (item.responseId) {
            previousResponseId = item.responseId;
          }

          // Fetch TTS audio
          try {
            const audioBuffer = await fetchTtsAudio(
              item.sentence,
              sessionConfig.voiceId,
              previousText,
              signal,
            );

            if (signal.aborted) break;

            const caption = item.sentence;
            enqueueChainRef.current = enqueueChainRef.current.then(() =>
              enqueue(audioBuffer, caption),
            );
          } catch (ttsErr) {
            if (signal.aborted) break;
            console.warn("[orchestrator] TTS wind-down failed, showing fallback:", ttsErr);
            setFallbackText(item.sentence);
            setTimeout(() => setFallbackText(""), 4000);
          }

          previousText = item.sentence;
          sentencesInPhase++;
        }
      }
    }

    return { previousResponseId, previousText, sentencesInPhase };
  }

  // ---------------------------------------------------------------------------
  // Main session loop
  // ---------------------------------------------------------------------------

  const runSession = useCallback(
    async (
      sid: string,
      phaseConfig: Record<SessionPhase, PhaseConfig>,
      options: {
        sessionLength: number;
        mood?: string;
        character?: string;
        voiceId?: string;
      },
    ) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const { signal } = controller;

      let currentPhaseName: SessionPhase = SESSION_PHASES[0]; // atmosphere
      let previousResponseId: string | null = null;
      let previousText: string | undefined = undefined;

      try {
        while (currentPhaseName && !signal.aborted) {
          const budget = phaseConfig[currentPhaseName];

          // Set current phase
          setCurrentPhase(currentPhaseName);

          console.log(`[orchestrator] Starting phase: ${currentPhaseName}`);

          // Run this phase
          const phaseResult = await runPhase(
            currentPhaseName,
            budget,
            options,
            {
              previousResponseId,
              previousText,
              sentencesInPhase: 0,
            },
            signal,
          );

          previousResponseId = phaseResult.previousResponseId;
          previousText = phaseResult.previousText;

          if (signal.aborted) break;

          // Transition to next phase
          const nextPhase = getNextPhase(currentPhaseName);

          if (nextPhase === null) {
            // Terminal phase complete -- session done
            console.log("[orchestrator] Session complete (terminal phase reached)");
            break;
          }

          console.log(`[orchestrator] Transitioning: ${currentPhaseName} -> ${nextPhase}`);
          currentPhaseName = nextPhase;
        }

        // Session complete (either all phases done or aborted)
        if (!signal.aborted) {
          // Call /api/session/complete
          try {
            await fetch("/api/session/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sessionId: sid }),
            });
          } catch {
            // Best-effort cleanup, ignore errors
          }

          setSessionEnded(true);
          setIsConnected(false);
          setCurrentPhase(null);
          enqueueChainRef.current = Promise.resolve();
        }
      } catch (err) {
        if (signal.aborted) {
          // Expected abort -- not an error
          return;
        }
        console.error("[orchestrator] Session loop error:", err);
        setError(err instanceof Error ? err.message : "Session error");
      } finally {
        isRunningRef.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enqueue, waitIfPaused],
  );

  // ---------------------------------------------------------------------------
  // Public API (identical to useSessionWebSocket)
  // ---------------------------------------------------------------------------

  /**
   * Initialize AudioContext. Must be called in a user gesture handler.
   * Sets isConnected = true (unlike WebSocket, there's no actual connection to open).
   */
  const connect = useCallback(() => {
    initQueue();
    setIsConnected(true);
    setError(null);
    console.log("[orchestrator] AudioContext initialized, isConnected=true");
  }, [initQueue]);

  /**
   * Start a new session. Calls POST /api/session/start, then runs the main loop.
   */
  const startSession = useCallback(
    async (options?: {
      prompt?: string;
      sessionLength?: number;
      mood?: string;
      voiceId?: string;
      character?: string;
    }) => {
      if (isRunningRef.current) {
        console.warn("[orchestrator] startSession called but session already running");
        return;
      }
      isRunningRef.current = true;

      try {
        const response = await fetch("/api/session/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            character: options?.character,
            voice: options?.voiceId,
            mood: options?.mood,
            sessionLength: options?.sessionLength,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to start session: ${response.status}`);
        }

        const { sessionId: sid, phaseConfig } = (await response.json()) as {
          sessionId: string;
          phaseConfig: Record<SessionPhase, PhaseConfig>;
        };

        setSessionId(sid);
        sessionIdRef.current = sid;

        console.log(`[orchestrator] Session started: ${sid}`);

        // Run the main session loop (non-blocking)
        runSession(sid, phaseConfig, {
          sessionLength: options?.sessionLength ?? 15,
          mood: options?.mood,
          character: options?.character,
          voiceId: options?.voiceId,
        });
      } catch (err) {
        console.error("[orchestrator] startSession error:", err);
        setError(err instanceof Error ? err.message : "Failed to start session");
        isRunningRef.current = false;
      }
    },
    [runSession],
  );

  /** Pause both audio playback and the generation loop. */
  const pause = useCallback(() => {
    isPausedRef.current = true;
    pauseAudio();
  }, [pauseAudio]);

  /** Resume both audio playback and the generation loop. */
  const resume = useCallback(() => {
    isPausedRef.current = false;
    resumeAudio();
    if (resumeResolveRef.current) {
      resumeResolveRef.current();
      resumeResolveRef.current = null;
    }
  }, [resumeAudio]);

  /** End the current session and clean up. */
  const endSession = useCallback(() => {
    // Abort the running loop
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clean up audio
    stopAudio();

    // Complete the session on the server (best-effort)
    const sid = sessionIdRef.current;
    if (sid) {
      fetch("/api/session/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid }),
      }).catch(() => {
        // Best-effort cleanup
      });
    }

    setSessionEnded(true);
    setIsConnected(false);
    setCurrentPhase(null);
    enqueueChainRef.current = Promise.resolve();
    isRunningRef.current = false;
  }, [stopAudio]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      stopAudio();
      isRunningRef.current = false;
    };
  }, [stopAudio]);

  // ---------------------------------------------------------------------------
  // Return shape -- identical to useSessionWebSocket
  // ---------------------------------------------------------------------------
  return {
    connect,
    startSession,
    pause,
    resume,
    endSession,
    isConnected,
    isPlaying,
    isPaused,
    currentText: currentCaption || fallbackText,
    sessionId,
    currentPhase,
    sessionEnded,
    audioContext,
    voiceGain,
    ambientGain,
    error,
  };
}
