---
phase: 09-differentiators-polish
plan: 02
subsystem: audio
tags: [web-audio-api, gainnode, audio-mixing, ambient-audio, volume-control, react-hooks]

# Dependency graph
requires:
  - phase: 04-tts-audio-streaming/03
    provides: "AudioPlaybackQueue class and useAudioQueue hook with Web Audio API playback"
provides:
  - "AudioPlaybackQueue with GainNode routing for independent voice volume control"
  - "Dual-channel GainNode architecture (voiceGain + ambientGain) in useAudioQueue"
  - "useAmbientAudio hook for looping background soundscapes via AudioBufferSourceNode"
  - "VolumeMixer component with click-free volume sliders for voice and ambient channels"
  - "setVolume utility using linearRampToValueAtTime for pop-free audio transitions"
affects: [09-differentiators-polish/03]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Dual GainNode routing through shared AudioContext.destination", "AudioBufferSourceNode loop=true for seamless ambient audio", "linearRampToValueAtTime for click-free 50ms volume transitions"]

key-files:
  created:
    - src/hooks/use-ambient-audio.ts
    - src/components/session/volume-mixer.tsx
  modified:
    - src/hooks/use-audio-queue.ts

key-decisions:
  - "voiceGain default 1.0, ambientGain default 0.3 -- ambient starts quieter as background layer"
  - "GainNodes created alongside AudioContext in initQueue (user gesture handler) to maintain autoplay compliance"
  - "50ms linear ramp for volume changes prevents audible click artifacts on slider interaction"
  - "useAmbientAudio accepts audioContext and ambientGain as params (not creating its own) to enforce single AudioContext"

patterns-established:
  - "Dual GainNode audio routing: all voice sources connect to voiceGain, all ambient to ambientGain, both connect to ctx.destination"
  - "setVolume(gainNode, value) utility for click-free volume control via linearRampToValueAtTime"
  - "SOUNDSCAPE_OPTIONS/SOUNDSCAPE_URLS as centralized ambient audio configuration"

requirements-completed: [DIFF-02, DIFF-03]

# Metrics
duration: 2min
completed: 2026-02-21
---

# Phase 09 Plan 02: Audio Mixing & Ambient Soundscapes Summary

**Dual-channel GainNode audio mixing with independent voice/ambient volume control and looping background soundscape infrastructure**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-21T11:33:25Z
- **Completed:** 2026-02-21T11:35:30Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Refactored AudioPlaybackQueue to route voice audio through voiceGain GainNode instead of directly to AudioContext.destination, enabling independent volume control
- Created dual-channel GainNode architecture in useAudioQueue: voiceGain (1.0) for TTS voice and ambientGain (0.3) for background soundscapes, both feeding into shared AudioContext.destination
- Built useAmbientAudio hook supporting 5 soundscape options (rain, ocean, forest, ambient, silence) with seamless looping via AudioBufferSourceNode.loop=true
- Created VolumeMixer component with two labeled range sliders using linearRampToValueAtTime for click-free 50ms volume transitions

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor AudioPlaybackQueue for GainNode routing and create useAmbientAudio hook** - `5ad69fc` (feat)
2. **Task 2: Create VolumeMixer component** - `676e396` (feat)

## Files Created/Modified
- `src/hooks/use-audio-queue.ts` - Refactored AudioPlaybackQueue to route through voiceGain GainNode; useAudioQueue now creates and exposes audioContext, voiceGain, ambientGain
- `src/hooks/use-ambient-audio.ts` - New hook for looping ambient soundscapes with SOUNDSCAPE_OPTIONS config and start/stop controls
- `src/components/session/volume-mixer.tsx` - New VolumeMixer component with voice/ambient range sliders and setVolume utility for click-free transitions

## Decisions Made
- voiceGain default at 1.0 (full volume) and ambientGain at 0.3 (background level) to ensure voice is always primary audio
- GainNodes created in initQueue alongside AudioContext to maintain browser autoplay policy compliance via user gesture handler
- 50ms linear ramp (linearRampToValueAtTime) chosen for volume transitions -- fast enough to feel responsive, slow enough to prevent click artifacts
- Single AudioContext shared between voice and ambient channels to avoid browser AudioContext limit (anti-pattern from research)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. Ambient audio files (rain.mp3, ocean.mp3, forest.mp3, ambient.mp3) in public/audio/ambient/ are referenced but not included -- they need to be sourced from CC-licensed providers (Freesound, Mixkit) and placed in the public directory.

## Next Phase Readiness
- Audio mixing infrastructure ready for integration into SessionScreen in Plan 03
- useAudioQueue now exposes audioContext, voiceGain, ambientGain for consumption by useAmbientAudio and VolumeMixer
- VolumeMixer component ready for placement in session screen bottom controls area
- Ambient soundscape URLs defined but audio files need to be sourced and placed in public/audio/ambient/

## Self-Check: PASSED

All 3 files verified present. Both commit hashes (5ad69fc, 676e396) verified in git log.

---
*Phase: 09-differentiators-polish*
*Completed: 2026-02-21*
