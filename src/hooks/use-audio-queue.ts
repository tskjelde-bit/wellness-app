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
export class AudioPlaybackQueue {
  private audioContext: AudioContext;
  private voiceGain: GainNode;
  private queue: AudioBuffer[] = [];
  private nextPlayTime: number = 0;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  onStateChange: (() => void) | null = null;

  constructor(audioContext: AudioContext, voiceGain: GainNode) {
    this.audioContext = audioContext;
    this.voiceGain = voiceGain;
  }

  /**
   * Decode an MP3/audio chunk and enqueue it for playback.
   * Uses .slice(0) to prevent detached ArrayBuffer issues when the
   * same buffer is referenced elsewhere.
   */
  async enqueue(audioData: ArrayBuffer): Promise<void> {
    try {
      console.log(`[AudioQueue] Decoding chunk of size ${audioData.byteLength} bytes...`);
      const decoded = await this.audioContext.decodeAudioData(
        audioData.slice(0)
      );
      console.log(`[AudioQueue] Decoded successfully: ${decoded.duration.toFixed(2)}s`);
      this.queue.push(decoded);
      if (!this.isPlaying && !this.isPaused) {
        this.playNext();
      }
    } catch (err) {
      console.warn("[AudioQueue] Could not decode audio chunk:", err);
    }
  }

  /**
   * Schedule the next buffer in the queue for gap-free playback.
   */
  private playNext(): void {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.onStateChange?.();
      return;
    }

    this.isPlaying = true;
    const buffer = this.queue.shift()!;

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.voiceGain);

    // Schedule at the later of "now" or the previously scheduled end time
    // to ensure gap-free continuity between chunks.
    const startTime = Math.max(
      this.audioContext.currentTime,
      this.nextPlayTime
    );
    source.start(startTime);
    this.nextPlayTime = startTime + buffer.duration;

    source.onended = () => this.playNext();
    this.onStateChange?.();
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
    this.audioContext.close();
    this.queue = [];
    this.isPlaying = false;
    this.isPaused = false;
    this.nextPlayTime = 0;
    this.onStateChange?.();
  }

  /** Current playback state snapshot. */
  get state() {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      queueLength: this.queue.length,
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
  const [state, setState] = useState<AudioQueueState>({
    isPlaying: false,
    isPaused: false,
    queueLength: 0,
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
    queueRef.current = queue;

    console.log("[AudioQueue] Initialized AudioContext and GainNodes");

    // Expose via state so consumers can use them reactively
    setAudioContext(ctx);
    setVoiceGain(vGain);
    setAmbientGain(aGain);
  }, []);

  /** Enqueue an audio chunk (ArrayBuffer) for playback. */
  const enqueue = useCallback(async (data: ArrayBuffer) => {
    await queueRef.current?.enqueue(data);
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
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      queueRef.current?.stop();
      queueRef.current = null;
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
  };
}
