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
 */
export class AudioPlaybackQueue {
  private audioContext: AudioContext;
  private queue: AudioBuffer[] = [];
  private nextPlayTime: number = 0;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  onStateChange: (() => void) | null = null;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  /**
   * Decode an MP3/audio chunk and enqueue it for playback.
   * Uses .slice(0) to prevent detached ArrayBuffer issues when the
   * same buffer is referenced elsewhere.
   */
  async enqueue(audioData: ArrayBuffer): Promise<void> {
    const decoded = await this.audioContext.decodeAudioData(
      audioData.slice(0)
    );
    this.queue.push(decoded);
    if (!this.isPlaying && !this.isPaused) {
      this.playNext();
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
    source.connect(this.audioContext.destination);

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
 */
export function useAudioQueue() {
  const queueRef = useRef<AudioPlaybackQueue | null>(null);
  const [state, setState] = useState<AudioQueueState>({
    isPlaying: false,
    isPaused: false,
    queueLength: 0,
  });

  /**
   * Initialize the AudioContext and AudioPlaybackQueue.
   * MUST be called inside a user gesture handler (click/tap).
   */
  const initQueue = useCallback(() => {
    // Avoid double-init
    if (queueRef.current) return;

    const ctx = new AudioContext();
    const queue = new AudioPlaybackQueue(ctx);
    queue.onStateChange = () => {
      setState(queue.state);
    };
    queueRef.current = queue;
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
    isPlaying: state.isPlaying,
    isPaused: state.isPaused,
    queueLength: state.queueLength,
  };
}
