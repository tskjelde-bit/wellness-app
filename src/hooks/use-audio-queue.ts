"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// AudioPlaybackQueue -- Web Audio API gap-free scheduled playback
// ---------------------------------------------------------------------------

/**
 * Manages a queue of decoded AudioBuffers and schedules them for
 * gap-free playback using AudioBufferSourceNode.start(nextPlayTime).
 *
 * AudioContext MUST be created externally inside a user gesture handler
 * to comply with browser autoplay policy.
 *
 * Audio is routed through a voiceGain GainNode (instead of directly to
 * AudioContext.destination) to enable independent voice volume control
 * alongside ambient soundscapes.
 */
interface QueueItem {
  buffer: AudioBuffer;
  caption: string;
}

export class AudioPlaybackQueue {
  private audioContext: AudioContext;
  private voiceGain: GainNode;
  private queue: QueueItem[] = [];
  private nextPlayTime: number = 0;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private isPlayNextScheduled: boolean = false;
  private activeSource: AudioBufferSourceNode | null = null;
  private safetyTimer: ReturnType<typeof setTimeout> | null = null;
  private currentCaption: string = "";
  onStateChange: (() => void) | null = null;
  onCaptionChange: ((caption: string) => void) | null = null;

  constructor(audioContext: AudioContext, voiceGain: GainNode) {
    this.audioContext = audioContext;
    this.voiceGain = voiceGain;
  }

  /**
   * Decode an MP3/audio chunk and enqueue it for playback.
   * Uses .slice(0) to prevent detached ArrayBuffer issues when the
   * same buffer is referenced elsewhere.
   */
  async enqueue(audioData: ArrayBuffer, caption: string = ""): Promise<void> {
    try {
      // Safety-net: resume AudioContext if it's still suspended (e.g. browser
      // policy blocked it despite the user-gesture init).
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      console.log(`[AudioQueue] Decoding chunk of size ${audioData.byteLength} bytes...`);
      const decoded = await this.audioContext.decodeAudioData(
        audioData.slice(0)
      );
      console.log(`[AudioQueue] Decoded successfully: ${decoded.duration.toFixed(2)}s`);
      this.queue.push({ buffer: decoded, caption });
      if (!this.isPlaying && !this.isPaused) {
        this.playNext();
      }
    } catch (err) {
      console.warn("[AudioQueue] Could not decode audio chunk:", err);
      // Show caption as fallback even though audio decoding failed
      if (caption) {
        this.onCaptionChange?.(caption);
        const fallbackCaption = caption;
        setTimeout(() => {
          if (this.currentCaption === fallbackCaption) {
            this.currentCaption = "";
            this.onCaptionChange?.("");
          }
        }, 4000);
      }
    }
  }

  /**
   * Schedule the next buffer in the queue for gap-free playback.
   */
  private playNext(): void {
    // Reentrancy guard: prevent concurrent playNext() from onended + enqueue
    if (this.isPlayNextScheduled) return;
    this.isPlayNextScheduled = true;

    // Resume AudioContext if browser suspended it (e.g. background tab)
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.isPlayNextScheduled = false;
      this.activeSource = null;
      this.nextPlayTime = 0;
      this.currentCaption = "";
      this.onCaptionChange?.("");
      this.onStateChange?.();
      return;
    }

    this.isPlaying = true;
    const item = this.queue.shift()!;

    try {
      const source = this.audioContext.createBufferSource();
      source.buffer = item.buffer;
      source.playbackRate.value = 1.0; // explicit safeguard
      source.connect(this.voiceGain);
      this.activeSource = source;

      // Update caption when this buffer starts playing
      this.currentCaption = item.caption;
      this.onCaptionChange?.(item.caption);

      // Schedule at the later of "now" or the previously scheduled end time
      // to ensure gap-free continuity between chunks.
      const startTime = Math.max(
        this.audioContext.currentTime,
        this.nextPlayTime
      );
      source.start(startTime);
      this.nextPlayTime = startTime + item.buffer.duration;

      // Safety timeout: if onended never fires (e.g. AudioContext frozen),
      // force-advance the queue to prevent permanent stall.
      const expectedDuration = (startTime + item.buffer.duration) - this.audioContext.currentTime;
      if (this.safetyTimer) clearTimeout(this.safetyTimer);
      this.safetyTimer = setTimeout(() => {
        console.warn("[AudioQueue] Safety timeout — onended did not fire, forcing next");
        this.safetyTimer = null;
        this.isPlayNextScheduled = false;
        this.playNext();
      }, (expectedDuration * 1000) + 3000);

      source.onended = () => {
        if (this.safetyTimer) { clearTimeout(this.safetyTimer); this.safetyTimer = null; }
        this.isPlayNextScheduled = false;
        this.playNext();
      };
      this.onStateChange?.();
    } catch (err) {
      console.warn("[AudioQueue] Error in playNext:", err);
      this.isPlayNextScheduled = false;
      // Try next buffer in queue
      if (this.queue.length > 0) {
        this.playNext();
      } else {
        this.isPlaying = false;
        this.activeSource = null;
        this.currentCaption = "";
        this.onCaptionChange?.("");
        this.onStateChange?.();
      }
    }
  }

  /** Pause playback by suspending the AudioContext. */
  pause(): void {
    this.audioContext.suspend();
    this.isPaused = true;
    this.onStateChange?.();
  }

  /** Resume playback by resuming the AudioContext. */
  resume(): void {
    this.audioContext.resume();
    this.isPaused = false;
    if (this.queue.length > 0 && !this.isPlaying) {
      this.playNext();
    }
    this.onStateChange?.();
  }

  /** Stop playback, clear queue, and close the AudioContext. */
  stop(): void {
    // Clear safety timer to prevent ghost playNext() calls
    if (this.safetyTimer) { clearTimeout(this.safetyTimer); this.safetyTimer = null; }

    // Disconnect active source before closing to prevent ghost onended callbacks
    if (this.activeSource) {
      this.activeSource.onended = null;
      try {
        this.activeSource.stop();
        this.activeSource.disconnect();
      } catch {
        // Source may already be stopped
      }
      this.activeSource = null;
    }

    this.audioContext.close();
    this.queue = [];
    this.isPlaying = false;
    this.isPaused = false;
    this.isPlayNextScheduled = false;
    this.nextPlayTime = 0;
    this.onStateChange?.();
  }

  /** Current playback state snapshot. */
  get state() {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      queueLength: this.queue.length,
      currentCaption: this.currentCaption,
    };
  }
}

// ---------------------------------------------------------------------------
// useAudioQueue React hook
// ---------------------------------------------------------------------------

interface AudioQueueState {
  isPlaying: boolean;
  isPaused: boolean;
  queueLength: number;
  currentCaption: string;
}

/**
 * React hook wrapping AudioPlaybackQueue.
 *
 * Call `initQueue()` inside a user gesture handler (e.g. button click)
 * to create the AudioContext. This is required by browser autoplay policy.
 *
 * Returns audioContext, voiceGain, and ambientGain for use with
 * useAmbientAudio and VolumeMixer components.
 */
export function useAudioQueue() {
  const queueRef = useRef<AudioPlaybackQueue | null>(null);
  const visibilityHandlerRef = useRef<(() => void) | null>(null);
  const [state, setState] = useState<AudioQueueState>({
    isPlaying: false,
    isPaused: false,
    queueLength: 0,
    currentCaption: "",
  });
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [voiceGain, setVoiceGain] = useState<GainNode | null>(null);
  const [ambientGain, setAmbientGain] = useState<GainNode | null>(null);

  /**
   * Initialize the AudioContext, GainNodes, and AudioPlaybackQueue.
   * MUST be called inside a user gesture handler (click/tap).
   *
   * Creates two GainNode channels:
   * - voiceGain: routes TTS voice audio (default volume 1.0)
   * - ambientGain: routes ambient soundscapes (default volume 0.3)
   * Both feed into AudioContext.destination via a single shared context.
   */
  const initQueue = useCallback(() => {
    // Avoid double-init
    if (queueRef.current) return;

    const ctx = new AudioContext();
    // Explicitly resume in case it's created suspended (common in some browsers)
    ctx.resume();

    // Voice channel GainNode (full volume by default)
    const vGain = ctx.createGain();
    vGain.gain.value = 1.0;
    vGain.connect(ctx.destination);

    // Ambient channel GainNode (lower volume by default)
    const aGain = ctx.createGain();
    aGain.gain.value = 0.3;
    aGain.connect(ctx.destination);

    const queue = new AudioPlaybackQueue(ctx, vGain);
    queue.onStateChange = () => {
      setState(queue.state);
    };
    queue.onCaptionChange = (caption: string) => {
      setState((prev) => ({ ...prev, currentCaption: caption }));
    };
    queueRef.current = queue;

    // Resume AudioContext when tab becomes visible again
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && ctx.state === "suspended") {
        console.log("[AudioQueue] visibilitychange resume");
        ctx.resume();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    visibilityHandlerRef.current = handleVisibility;

    console.log("[AudioQueue] Initialized AudioContext and GainNodes");

    // Expose via state so consumers can use them reactively
    setAudioContext(ctx);
    setVoiceGain(vGain);
    setAmbientGain(aGain);
  }, []);

  /** Enqueue an audio chunk (ArrayBuffer) with optional caption for playback. */
  const enqueue = useCallback(async (data: ArrayBuffer, caption?: string) => {
    await queueRef.current?.enqueue(data, caption);
  }, []);

  /** Pause audio playback. */
  const pause = useCallback(() => {
    queueRef.current?.pause();
  }, []);

  /** Resume audio playback. */
  const resume = useCallback(() => {
    queueRef.current?.resume();
  }, []);

  /** Stop playback and clean up. */
  const stop = useCallback(() => {
    queueRef.current?.stop();
    queueRef.current = null;
    if (visibilityHandlerRef.current) {
      document.removeEventListener("visibilitychange", visibilityHandlerRef.current);
      visibilityHandlerRef.current = null;
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      queueRef.current?.stop();
      queueRef.current = null;
      if (visibilityHandlerRef.current) {
        document.removeEventListener("visibilitychange", visibilityHandlerRef.current);
        visibilityHandlerRef.current = null;
      }
    };
  }, []);

  return {
    initQueue,
    enqueue,
    pause,
    resume,
    stop,
    audioContext,
    voiceGain,
    ambientGain,
    isPlaying: state.isPlaying,
    isPaused: state.isPaused,
    queueLength: state.queueLength,
    currentCaption: state.currentCaption,
  };
}
