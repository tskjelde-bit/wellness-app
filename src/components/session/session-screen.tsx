"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionWebSocket } from "@/hooks/use-session-ws";
import { useAmbientAudio } from "@/hooks/use-ambient-audio";
import { BreathingOrb } from "@/components/session/breathing-orb";
import { PreSessionFlow } from "@/components/session/pre-session-flow";
import { SessionControls } from "@/components/session/session-controls";
import { PhaseIndicator } from "@/components/session/phase-indicator";
import { VolumeMixer } from "@/components/session/volume-mixer";
import { PostSessionScreen } from "@/components/session/post-session-screen";

export function SessionScreen() {
  const router = useRouter();

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
    sessionEnded,
    audioContext,
    voiceGain,
    ambientGain,
    error,
  } = useSessionWebSocket();

  const { startSoundscape, stopSoundscape } = useAmbientAudio(
    audioContext,
    ambientGain,
  );

  const [hasInitiated, setHasInitiated] = useState(false);
  const [selectedLength, setSelectedLength] = useState(15);
  const [selectedMood, setSelectedMood] = useState("neutral");
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | undefined>();
  const [selectedSoundscape, setSelectedSoundscape] = useState("silence");
  const [, setSensoryConsent] = useState(false);
  const [showMixer, setShowMixer] = useState(false);

  // PreSessionFlow callback -- connect (AudioContext + WS) in gesture handler
  const handleBegin = (options: {
    sessionLength: number;
    sensoryConsent: boolean;
    mood: string;
    voiceId: string;
    soundscape: string;
  }) => {
    setSelectedLength(options.sessionLength);
    setSensoryConsent(options.sensoryConsent);
    setSelectedMood(options.mood);
    setSelectedVoiceId(options.voiceId);
    setSelectedSoundscape(options.soundscape);
    connect();
    setHasInitiated(true);
  };

  // Start session once WebSocket connection opens (Research Pitfall 3: race condition)
  useEffect(() => {
    if (hasInitiated && isConnected && !sessionId) {
      startSession({
        sessionLength: selectedLength,
        mood: selectedMood,
        voiceId: selectedVoiceId,
      });
    }
  }, [hasInitiated, isConnected, sessionId, startSession, selectedLength, selectedMood, selectedVoiceId]);

  // Start ambient soundscape after connection (Research Pitfall 1: after user gesture)
  useEffect(() => {
    if (isConnected && selectedSoundscape !== "silence") {
      startSoundscape(selectedSoundscape);
    }
  }, [isConnected, selectedSoundscape, startSoundscape]);

  // Stop ambient soundscape when session ends
  useEffect(() => {
    if (sessionEnded) {
      stopSoundscape();
    }
  }, [sessionEnded, stopSoundscape]);

  // Clean up: stop soundscape on unmount
  useEffect(() => {
    return () => {
      stopSoundscape();
    };
  }, [stopSoundscape]);

  // Handle end session -- navigate back handled by session_end + user action
  const handleEnd = () => {
    endSession();
  };

  // ---- Post-session: aftercare screen ----
  if (sessionEnded) {
    return <PostSessionScreen onDone={() => router.push("/dashboard")} />;
  }

  // ---- Pre-session: PreSessionFlow (mood -> voice -> length + soundscape -> consent) ----
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

      {/* Volume mixer overlay (above controls) */}
      {showMixer && (
        <div className="absolute bottom-24 left-0 right-0 flex justify-center animate-fade-in">
          <VolumeMixer voiceGain={voiceGain} ambientGain={ambientGain} />
        </div>
      )}

      {/* Session controls at bottom (pause/resume + end session + mixer toggle) */}
      <div
        className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-3"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <SessionControls
          isPaused={isPaused}
          onPause={pause}
          onResume={resume}
          onEnd={handleEnd}
        />

        {/* Mixer toggle button */}
        <button
          onClick={() => setShowMixer((v) => !v)}
          className="text-xs text-cream/30 transition-colors hover:text-cream/50"
          aria-label={showMixer ? "Hide volume mixer" : "Show volume mixer"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        </button>
      </div>
    </div>
  );
}
