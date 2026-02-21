"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ServerMessage } from "@/lib/ws/message-types";
import { useAudioQueue } from "./use-audio-queue";

// ---------------------------------------------------------------------------
// useSessionWebSocket -- WebSocket + audio integration hook
// ---------------------------------------------------------------------------

/**
 * React hook managing the WebSocket connection to /api/session/ws and routing
 * incoming messages to the AudioPlaybackQueue and React state.
 *
 * Usage:
 * 1. User clicks "Start" -> call `connect()` (creates AudioContext in gesture)
 * 2. Once connected, call `startSession(prompt?)` to begin TTS streaming
 * 3. Binary audio frames are routed to AudioPlaybackQueue for gap-free playback
 * 4. JSON control messages update React state (currentText, sessionId, etc.)
 * 5. Use `pause()`, `resume()`, `endSession()` for session lifecycle control
 */
export function useSessionWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

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
  } = useAudioQueue();

  /**
   * Open WebSocket connection and initialize AudioContext.
   * MUST be called inside a user gesture handler (e.g. button onClick).
   */
  const connect = useCallback(() => {
    // Initialize AudioContext in user gesture context (browser autoplay policy)
    initQueue();

    // Determine WebSocket URL based on current page protocol
    const protocol =
      window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/api/session/ws`;

    const ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event: MessageEvent) => {
      if (event.data instanceof ArrayBuffer) {
        // Binary frame: audio chunk -> feed to playback queue
        enqueue(event.data);
      } else {
        // Text frame: JSON control message
        try {
          const message = JSON.parse(event.data as string) as ServerMessage;

          switch (message.type) {
            case "session_start":
              setSessionId(message.sessionId);
              break;
            case "text":
              setCurrentText(message.data);
              break;
            case "sentence_end":
              // No-op for now; could clear currentText or trigger UI transitions
              break;
            case "phase_start":
              setCurrentPhase(message.phase);
              break;
            case "phase_transition":
              setCurrentPhase(message.to);
              break;
            case "session_end":
              setSessionEnded(true);
              setIsConnected(false);
              setCurrentPhase(null);
              stopAudio();
              break;
            case "error":
              setError(message.message);
              break;
          }
        } catch {
          // Ignore malformed JSON messages
        }
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = () => {
      setError("Connection error");
    };

    wsRef.current = ws;
  }, [initQueue, enqueue, stopAudio]);

  /**
   * Send a start_session command to begin TTS streaming.
   * Connection must already be open via `connect()`.
   */
  const startSession = useCallback(
    (options?: { prompt?: string; sessionLength?: number; mood?: string; voiceId?: string }) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "start_session",
            prompt: options?.prompt,
            sessionLength: options?.sessionLength,
            mood: options?.mood,
            voiceId: options?.voiceId,
          })
        );
      }
    },
    []
  );

  /** Pause both audio playback and server-side streaming. */
  const pause = useCallback(() => {
    pauseAudio();
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "pause" }));
    }
  }, [pauseAudio]);

  /** Resume both audio playback and server-side streaming. */
  const resume = useCallback(() => {
    resumeAudio();
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "resume" }));
    }
  }, [resumeAudio]);

  /** End the current session and clean up. */
  const endSession = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "end" }));
    }
    stopAudio();
  }, [stopAudio]);

  // Clean up WebSocket and audio on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      stopAudio();
    };
  }, [stopAudio]);

  return {
    connect,
    startSession,
    pause,
    resume,
    endSession,
    isConnected,
    isPlaying,
    isPaused,
    currentText,
    sessionId,
    currentPhase,
    sessionEnded,
    audioContext,
    voiceGain,
    ambientGain,
    error,
  };
}
