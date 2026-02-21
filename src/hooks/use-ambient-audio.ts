"use client";

import { useCallback, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Ambient Audio -- looping background soundscapes via Web Audio API
// ---------------------------------------------------------------------------

export const SOUNDSCAPE_OPTIONS = [
  { id: "rain", label: "Regn" },
  { id: "ocean", label: "Hav" },
  { id: "forest", label: "Skog" },
  { id: "ambient", label: "Atmosfære" },
  { id: "silence", label: "Stillhet" },
] as const;

export const SOUNDSCAPE_URLS: Record<string, string> = {
  rain: "/audio/ambient/rain.mp3",
  ocean: "/audio/ambient/ocean.mp3",
  forest: "/audio/ambient/forest.mp3",
  ambient: "/audio/ambient/ambient.mp3",
  silence: "",
};

/**
 * Hook for managing looping ambient background soundscapes.
 *
 * Routes audio through the provided ambientGain GainNode, enabling
 * independent volume control via the VolumeMixer component.
 *
 * Requires an existing AudioContext (created in user gesture handler
 * via useAudioQueue's initQueue).
 */
export function useAmbientAudio(
  audioContext: AudioContext | null,
  ambientGain: GainNode | null,
) {
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [activeSoundscape, setActiveSoundscape] = useState<string>("silence");

  /**
   * Start a looping ambient soundscape. Stops any previously playing
   * soundscape first. Uses AudioBufferSourceNode with loop=true for
   * seamless background audio.
   */
  const startSoundscape = useCallback(
    async (key: string) => {
      // Stop previous source if playing
      if (sourceRef.current) {
        try {
          sourceRef.current.stop();
        } catch {
          // Already stopped -- ignore
        }
        sourceRef.current = null;
      }

      if (key === "silence" || !audioContext || !ambientGain) {
        setActiveSoundscape(key);
        return;
      }

      const url = SOUNDSCAPE_URLS[key];
      if (!url) return;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`[Ambient] Audio file not found: ${url}`);
          setActiveSoundscape(key);
          return;
        }

        const arrayBuffer = await response.arrayBuffer();
        // .slice(0) prevents detached buffer issues (same pattern as AudioPlaybackQueue)
        const audioBuffer = await audioContext.decodeAudioData(
          arrayBuffer.slice(0),
        );

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.loop = true;
        source.connect(ambientGain);
        source.start();

        sourceRef.current = source;
      } catch (err) {
        console.warn("[Ambient] Could not load soundscape:", err);
      }
      setActiveSoundscape(key);
    },
    [audioContext, ambientGain],
  );

  /** Stop the current ambient soundscape and reset to silence. */
  const stopSoundscape = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {
        // Already stopped -- ignore
      }
      sourceRef.current = null;
    }
    setActiveSoundscape("silence");
  }, []);

  return { startSoundscape, stopSoundscape, activeSoundscape };
}
