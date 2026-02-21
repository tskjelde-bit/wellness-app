"use client";

import { useEffect, useState } from "react";
import { useSessionWebSocket } from "@/hooks/use-session-ws";
import { BreathingOrb } from "@/components/session/breathing-orb";
import { PreSessionFlow } from "@/components/session/pre-session-flow";
import { SessionControls } from "@/components/session/session-controls";
import { PhaseIndicator } from "@/components/session/phase-indicator";

export function SessionScreen() {
  const {
    connect,
    startSession,
    endSession,
    pause,
    resume,
    isConnected,
    isPlaying,
    isPaused,
    currentText,
    sessionId,
    currentPhase,
    error,
  } = useSessionWebSocket();

  const [hasInitiated, setHasInitiated] = useState(false);
  const [selectedLength, setSelectedLength] = useState(15);
  const [, setSensoryConsent] = useState(false);

  // PreSessionFlow callback -- connect (AudioContext + WS) in gesture handler
  const handleBegin = (options: {
    sessionLength: number;
    sensoryConsent: boolean;
  }) => {
    setSelectedLength(options.sessionLength);
    setSensoryConsent(options.sensoryConsent);
    connect();
    setHasInitiated(true);
  };

  // Start session once WebSocket connection opens (Research Pitfall 3: race condition)
  useEffect(() => {
    if (hasInitiated && isConnected && !sessionId) {
      startSession({ sessionLength: selectedLength });
    }
  }, [hasInitiated, isConnected, sessionId, startSession, selectedLength]);

  // Handle end session -- navigate back handled by session_end + user action
  const handleEnd = () => {
    endSession();
  };

  // ---- Pre-session: PreSessionFlow (length selection + conversational consent) ----
  if (!hasInitiated) {
    return <PreSessionFlow onBegin={handleBegin} />;
  }

  // ---- Connecting state ----
  if (!isConnected && hasInitiated) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-charcoal safe-area-padding">
        <div className="animate-pulse text-cream/60 text-sm">
          Connecting...
        </div>
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

      {/* Phase progress indicator at top */}
      <div
        className="absolute top-6 left-0 right-0 flex justify-center"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <PhaseIndicator currentPhase={currentPhase} />
      </div>

      {/* Central breathing orb -- stops animating when paused */}
      <BreathingOrb isPlaying={isPlaying && !isPaused} />

      {/* Current sentence text (subtle overlay) */}
      {currentText && (
        <p className="mt-8 max-w-sm px-4 text-center text-sm text-cream/60 animate-fade-in">
          {currentText}
        </p>
      )}

      {/* Session controls at bottom (pause/resume + end session) */}
      <div
        className="absolute bottom-8 left-0 right-0 flex justify-center"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <SessionControls
          isPaused={isPaused}
          onPause={pause}
          onResume={resume}
          onEnd={handleEnd}
        />
      </div>
    </div>
  );
}
