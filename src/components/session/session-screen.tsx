"use client";

import { useEffect, useState } from "react";
import { useSessionWebSocket } from "@/hooks/use-session-ws";
import { BreathingOrb } from "@/components/session/breathing-orb";
import Link from "next/link";

export function SessionScreen() {
  const {
    connect,
    startSession,
    endSession,
    isConnected,
    isPlaying,
    currentText,
    sessionId,
    currentPhase,
    error,
  } = useSessionWebSocket();

  const [hasInitiated, setHasInitiated] = useState(false);

  // User taps "Begin Session" -> connect (AudioContext + WS) in gesture handler
  const handleStart = () => {
    connect();
    setHasInitiated(true);
  };

  // Start session once WebSocket connection opens (Research Pitfall 3: race condition)
  useEffect(() => {
    if (hasInitiated && isConnected && !sessionId) {
      startSession();
    }
  }, [hasInitiated, isConnected, sessionId, startSession]);

  // Handle end session -- navigate back handled by session_end + user action
  const handleEnd = () => {
    endSession();
  };

  // ---- Pre-session: "Begin Session" screen ----
  if (!hasInitiated) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-charcoal safe-area-padding">
        <div className="flex flex-col items-center gap-8">
          <BreathingOrb isPlaying={false} />
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleStart}
              className="flex min-h-[44px] items-center justify-center rounded-lg bg-rose px-8 py-3 font-medium text-white transition-colors hover:bg-rose-dark active:scale-[0.98]"
            >
              Begin Session
            </button>
            <Link
              href="/dashboard"
              className="text-sm text-cream/50 transition-colors hover:text-cream/70"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---- Connecting state ----
  if (!isConnected && hasInitiated) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-charcoal safe-area-padding">
        <div className="animate-pulse text-cream/60 text-sm">Connecting...</div>
      </div>
    );
  }

  // ---- Active session: voice-first minimal chrome ----
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-charcoal safe-area-padding">
      {/* Error banner */}
      {error && (
        <div className="absolute top-4 left-4 right-4 rounded-lg bg-rose/20 p-3 text-center text-sm text-cream/80 animate-fade-in safe-area-padding">
          {error}
        </div>
      )}

      {/* Central breathing orb */}
      <BreathingOrb isPlaying={isPlaying} />

      {/* Current sentence text (subtle overlay) */}
      {currentText && (
        <p className="mt-8 max-w-sm px-4 text-center text-sm text-cream/60 animate-fade-in">
          {currentText}
        </p>
      )}

      {/* Minimal end session control at bottom */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <button
          onClick={handleEnd}
          className="text-xs text-cream/30 transition-colors hover:text-cream/60"
        >
          End Session
        </button>
      </div>
    </div>
  );
}
