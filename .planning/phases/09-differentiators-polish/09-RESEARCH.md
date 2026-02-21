# Phase 9: Differentiators & Polish - Research

**Researched:** 2026-02-21
**Domain:** Mood adaptation, ambient audio mixing, voice selection, post-session aftercare
**Confidence:** HIGH

## Summary

Phase 9 adds five differentiating features on top of the fully built session pipeline: mood-based session adaptation (DIFF-01), ambient background soundscapes (DIFF-02), a voice/ambient volume mixer (DIFF-03), curated voice selection (DIFF-04), and post-session aftercare (DIFF-05). All five features integrate with existing infrastructure -- the pre-session flow, the orchestrator/prompt system, the Web Audio API playback queue, the ElevenLabs TTS client, and the session screen UI.

The key technical challenge is **audio mixing**: running two independent audio streams (TTS voice + ambient loop) through separate GainNode volume controls into a shared AudioContext destination. The existing `AudioPlaybackQueue` connects source nodes directly to `audioContext.destination`; this needs to be refactored to route through a GainNode so voice volume becomes independently controllable alongside an ambient audio loop with its own GainNode.

**Primary recommendation:** Use Web Audio API GainNodes for independent volume control, AudioBufferSourceNode with `loop=true` for ambient soundscapes, ElevenLabs premade voices (Emily, Rachel, and George/Thomas) for curated selection, mood context injection into the orchestrator's phase prompts, and a client-side post-session aftercare screen with LLM-generated reflection content.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DIFF-01 | Mood-based session selection -- user indicates emotional state, AI adapts session emphasis | Mood selector in PreSessionFlow, mood context injected into orchestrator phase prompts via new `moodContext` field. No new libraries needed. |
| DIFF-02 | Background ambient soundscapes layered under voice (rain, ocean, forest, ambient, silence) | Static MP3 loop files in `public/audio/ambient/`, AudioBufferSourceNode with `loop=true` and dedicated GainNode for volume. 5 options including silence. |
| DIFF-03 | Voice/ambient volume mixer for user control | Two GainNodes (voice + ambient) connected to shared AudioContext.destination. Mixer UI with two range sliders. GainNode.gain.setValueAtTime for click-free transitions. |
| DIFF-04 | 2-3 curated AI voice options with distinct warmth/tone profiles | ElevenLabs premade voices: Emily (calm meditation), Rachel (calm narration), George (current default -- raspy narration). Voice selection in PreSessionFlow, voiceId passed through WebSocket to TTS service. |
| DIFF-05 | Post-session aftercare with reflection prompts and grounding exercises | New post-session screen shown after `session_end` event. Static grounding exercises + optional LLM-generated reflection. No new backend route needed -- content can be generated client-side or as final orchestrator output. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Web Audio API (GainNode) | Browser native | Independent volume control for voice and ambient streams | Built into all browsers; no library needed for audio mixing |
| Web Audio API (AudioBufferSourceNode) | Browser native | Seamless looping of ambient soundscape files | Native loop support with loopStart/loopEnd; gap-free |
| ElevenLabs premade voices | SDK v2.36.0 (existing) | Multiple curated voice options | Already integrated; voice ID is the only parameter change |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (No new npm packages) | -- | -- | All features use existing stack (React, Web Audio API, ElevenLabs SDK, OpenAI) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Static MP3 ambient files in /public | CDN-hosted or API-fetched ambient audio | Static files are simpler, zero-latency, work offline; CDN adds complexity for no clear v1 benefit |
| AudioBufferSourceNode loop | HTML5 Audio element for ambient | AudioBufferSourceNode enables GainNode routing for mixer; HTML5 Audio lacks Web Audio API graph integration |
| Premade ElevenLabs voices | Voice Design API (custom voices) | Premade voices are free, instant, production-ready; custom voices add API complexity and cost |
| Client-side post-session content | Dedicated aftercare API endpoint | Client-side is simpler; static grounding exercises don't need server; optional LLM reflection can use existing orchestrator |

**Installation:**
```bash
# No new packages required -- all features use existing dependencies
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/session/
│   ├── pre-session-flow.tsx      # MODIFY: add mood selector + voice picker steps
│   ├── session-screen.tsx        # MODIFY: add mixer UI, ambient audio, post-session
│   ├── mood-selector.tsx         # NEW: mood selection UI component
│   ├── voice-picker.tsx          # NEW: voice selection UI component
│   ├── volume-mixer.tsx          # NEW: voice/ambient volume sliders
│   └── post-session-screen.tsx   # NEW: aftercare with grounding + reflection
├── hooks/
│   ├── use-audio-queue.ts        # MODIFY: add GainNode routing for voice channel
│   ├── use-ambient-audio.ts      # NEW: ambient audio loop with GainNode
│   └── use-session-ws.ts         # MODIFY: pass mood + voiceId in start_session
├── lib/
│   ├── session/
│   │   ├── orchestrator.ts       # MODIFY: accept mood, inject into prompt context
│   │   ├── phase-prompts.ts      # MODIFY: add mood adaptation to instructions
│   │   └── mood-prompts.ts       # NEW: mood-specific prompt modifiers
│   ├── tts/
│   │   ├── elevenlabs-client.ts  # MODIFY: export voice options config
│   │   └── tts-service.ts        # NO CHANGE: already accepts voiceId override
│   └── ws/
│       ├── message-types.ts      # MODIFY: add mood + voiceId to start_session
│       └── session-handler.ts    # MODIFY: pass mood + voiceId through pipeline
└── public/
    └── audio/
        └── ambient/
            ├── rain.mp3          # NEW: ~30-60s seamless loop, ~500KB-1MB each
            ├── ocean.mp3
            ├── forest.mp3
            └── ambient.mp3       # Generic warm ambient/drone
```

### Pattern 1: Dual GainNode Audio Mixer
**What:** Two independent GainNodes feeding into a single AudioContext destination, enabling separate volume control for voice TTS and ambient soundscapes.
**When to use:** Whenever two audio streams need independent volume control in the same browser context.
**Example:**
```typescript
// Source: MDN Web Audio API - GainNode
// https://developer.mozilla.org/en-US/docs/Web/API/GainNode

const audioCtx = new AudioContext();

// Voice channel (existing AudioPlaybackQueue output)
const voiceGain = audioCtx.createGain();
voiceGain.gain.value = 1.0; // Full voice volume default
voiceGain.connect(audioCtx.destination);

// Ambient channel (looping background soundscape)
const ambientGain = audioCtx.createGain();
ambientGain.gain.value = 0.3; // Lower default for background
ambientGain.connect(audioCtx.destination);

// Voice source nodes connect to voiceGain instead of destination
// source.connect(voiceGain);

// Ambient loop connects to ambientGain
// ambientSource.connect(ambientGain);
```

### Pattern 2: Seamless Ambient Audio Loop
**What:** An AudioBufferSourceNode with `loop=true` that plays a pre-loaded ambient soundscape file continuously throughout the session.
**When to use:** Background audio that must loop seamlessly without gaps or clicks.
**Example:**
```typescript
// Source: MDN AudioBufferSourceNode.loop
// https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/loop

async function startAmbientLoop(
  audioCtx: AudioContext,
  ambientGain: GainNode,
  soundscapeUrl: string,
): Promise<AudioBufferSourceNode> {
  const response = await fetch(soundscapeUrl);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.loop = true;
  source.loopStart = 0;
  source.loopEnd = audioBuffer.duration;
  source.connect(ambientGain);
  source.start();

  return source;
}
```

### Pattern 3: Click-Free Volume Control
**What:** Using AudioParam automation methods instead of direct `.value` assignment to prevent audible clicks when changing volume.
**When to use:** Any time a user adjusts a volume slider.
**Example:**
```typescript
// Source: MDN GainNode - preventing clicks
// https://developer.mozilla.org/en-US/docs/Web/API/GainNode

function setVolume(gainNode: GainNode, value: number): void {
  const now = gainNode.context.currentTime;
  gainNode.gain.setValueAtTime(gainNode.gain.value, now);
  gainNode.gain.linearRampToValueAtTime(value, now + 0.05); // 50ms ramp
}
```

### Pattern 4: Mood Context Injection
**What:** Injecting a mood-specific prompt modifier into the orchestrator's phase instructions to adapt session tone and emphasis.
**When to use:** When the user selects a mood before the session starts.
**Example:**
```typescript
// Mood-to-prompt mapping
const MOOD_PROMPTS: Record<string, string> = {
  anxious: `MOOD CONTEXT: The listener is feeling anxious or overwhelmed.
EMPHASIS: Prioritize grounding, slow breathing, and reassurance.
TONE SHIFT: Extra gentle, extra slow. Use phrases like "you're safe here" and "there's no rush."`,

  sad: `MOOD CONTEXT: The listener is feeling down or emotionally heavy.
EMPHASIS: Prioritize warmth, compassion, and gentle acknowledgment of feelings.
TONE SHIFT: Tender and validating. Use phrases like "it's okay to feel this way" and "you deserve this gentleness."`,

  stressed: `MOOD CONTEXT: The listener is carrying tension and stress.
EMPHASIS: Prioritize physical release, body scanning, and progressive relaxation.
TONE SHIFT: Steady and reassuring. Focus on letting go of tension, area by area.`,

  neutral: `MOOD CONTEXT: The listener is in a neutral or open state.
EMPHASIS: Standard session flow -- balanced across all phases.
TONE SHIFT: None -- use default warm, present tone.`,

  restless: `MOOD CONTEXT: The listener is feeling restless or having trouble settling.
EMPHASIS: Longer atmosphere phase, more grounding imagery, extra breathing focus.
TONE SHIFT: Patient and anchoring. Use phrases like "let yourself arrive here slowly."`,
};

// Injected into buildPhaseInstructions as additional context
function buildPhaseInstructions(
  phase: SessionPhase,
  transitionHint?: string,
  moodContext?: string, // NEW parameter
): string {
  const parts = [SAFETY_SYSTEM_PROMPT, SESSION_PROMPT];
  if (moodContext) parts.push(moodContext); // Mood before phase specifics
  parts.push(`CURRENT PHASE: ${phase.toUpperCase()}`);
  parts.push(PHASE_PROMPTS[phase]);
  if (transitionHint) parts.push(`TRANSITION: ${transitionHint}`);
  return parts.join("\n\n");
}
```

### Pattern 5: Post-Session Aftercare Flow
**What:** A dedicated screen shown after session_end that provides grounding exercises and optional reflection prompts.
**When to use:** Immediately after a session completes (not when user manually ends early -- offer but don't force).
**Example:**
```typescript
// Static grounding exercises (no API call needed)
const GROUNDING_EXERCISES = [
  {
    title: "5-4-3-2-1 Senses",
    description: "Notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste.",
  },
  {
    title: "Body Check-In",
    description: "Starting from your toes, slowly scan up through your body. Where do you feel calm? Where is there still tension?",
  },
  {
    title: "Three Breaths",
    description: "Take three slow, deep breaths. With each exhale, let your shoulders drop a little further.",
  },
];

const REFLECTION_PROMPTS = [
  "What moment during the session felt most peaceful to you?",
  "Is there a sensation you noticed that surprised you?",
  "What would you like to carry with you from this experience?",
  "How does your body feel different now compared to when you started?",
];
```

### Anti-Patterns to Avoid
- **Connecting ambient audio via HTML5 `<audio>` element:** Cannot route through GainNode graph; loses mixer control. Use AudioBufferSourceNode instead.
- **Setting GainNode.gain.value directly:** Causes audible clicks on volume change. Always use setValueAtTime + linearRampToValueAtTime.
- **Loading ambient audio on page load:** Must wait for AudioContext creation in user gesture handler. Fetch and decode after AudioContext exists.
- **Storing mood in database:** Mood is ephemeral per-session, not a persistent preference. Pass through WebSocket message and session state only.
- **Creating separate AudioContexts for voice and ambient:** Browsers limit AudioContext instances. Use ONE AudioContext with two GainNode channels.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Audio volume control | Custom gain math on raw samples | Web Audio API GainNode | Hardware-accelerated, click-free transitions, browser-native |
| Seamless audio looping | Manual buffer concatenation/replay | AudioBufferSourceNode.loop = true | Built-in seamless looping with sub-sample accuracy |
| Voice synthesis with different voices | Custom voice synthesis | ElevenLabs premade voices (change voiceId param) | Already integrated; voice ID swap is a one-line change |
| Ambient sound files | Generate sounds dynamically | Static MP3 files from Freesound/Mixkit (CC licensed) | Professional quality, zero runtime cost, predictable |
| Mood-specific prompting | Fine-tuned model per mood | Prompt modifier strings injected into existing instructions | LLM instruction following is sufficient; no training needed |

**Key insight:** Every feature in this phase is an integration/configuration change on existing infrastructure. No new heavy libraries, no new API providers, no new server architecture.

## Common Pitfalls

### Pitfall 1: AudioContext Creation Outside User Gesture
**What goes wrong:** Ambient audio or modified AudioPlaybackQueue fails to play on mobile browsers.
**Why it happens:** Browser autoplay policy requires AudioContext creation inside a click/tap handler. If ambient audio tries to create a new AudioContext or the refactored queue initializes before user gesture, playback is silently blocked.
**How to avoid:** All AudioContext creation stays in the existing `initQueue()` call inside `connect()` (triggered by button click). Ambient audio setup must happen AFTER AudioContext exists.
**Warning signs:** Audio works on desktop but not mobile; no errors in console.

### Pitfall 2: GainNode Click Artifacts on Volume Change
**What goes wrong:** Audible pops/clicks when user adjusts volume slider.
**Why it happens:** Setting `gainNode.gain.value` directly causes an instantaneous jump in audio amplitude, which the ear perceives as a click.
**How to avoid:** Always use `gain.setValueAtTime(currentValue, now)` followed by `gain.linearRampToValueAtTime(newValue, now + 0.05)` for a 50ms smooth transition.
**Warning signs:** Popping sounds on every slider interaction.

### Pitfall 3: Ambient Audio Memory Bloat
**What goes wrong:** Large ambient files consume excessive memory when decoded to AudioBuffer.
**Why it happens:** A 5-minute WAV at 44.1kHz stereo = ~50MB in memory as PCM. Even compressed MP3 files expand to full PCM on decode.
**How to avoid:** Keep ambient loop files SHORT (30-60 seconds) and use `loop=true` to repeat. A 45-second stereo MP3 at 128kbps = ~700KB on disk, ~7.5MB decoded. With 4 files loaded = ~30MB which is acceptable.
**Warning signs:** High memory usage in browser DevTools, especially on mobile.

### Pitfall 4: Voice ID Mismatch After ElevenLabs Updates
**What goes wrong:** Premade voice stops working if ElevenLabs deprecates or renames a voice ID.
**Why it happens:** ElevenLabs has transitioned from "premade" to "default" voices, and legacy voices may be retired.
**How to avoid:** Use current default/premade voices. Store voice IDs in a central config (elevenlabs-client.ts) for easy updates. Add a fallback voice ID in case primary fails.
**Warning signs:** TTS returns 404 or empty audio for a previously working voice.

### Pitfall 5: Mood Context Overwhelming Phase Prompts
**What goes wrong:** LLM ignores phase-specific instructions because the mood context is too dominant.
**Why it happens:** If mood prompt is too long or placed after phase instructions, it may override the phase's specific guidance in the LLM's attention.
**How to avoid:** Keep mood prompts SHORT (3-5 lines). Place mood context BEFORE the phase-specific prompt so the phase instructions are the most recent/salient context. Test each mood with each phase to verify balance.
**Warning signs:** All sessions feel the same regardless of mood selection; or sessions ignore phase structure.

### Pitfall 6: Race Condition in Pre-Session Flow State
**What goes wrong:** Mood and voice selections are lost between pre-session steps.
**Why it happens:** If mood/voice state is stored in separate component state that unmounts between steps, or if the step transition causes a re-render that resets state.
**How to avoid:** Lift mood and voice state to PreSessionFlow parent component, same pattern as existing `selectedLength` state. Pass all selections through `onBegin` callback.
**Warning signs:** Selections revert to defaults when proceeding to the next step.

### Pitfall 7: Post-Session Screen Accessibility After WebSocket Close
**What goes wrong:** Post-session aftercare screen cannot access session data after WebSocket disconnects.
**Why it happens:** `session_end` message triggers WebSocket close, and any session-related state is cleared.
**How to avoid:** Before transitioning to post-session screen, capture any needed data (session duration, mood, etc.) in React state. The post-session screen is entirely client-side with static content, so it doesn't need the WebSocket.
**Warning signs:** Post-session screen shows "no session" or redirects away.

## Code Examples

### Refactoring AudioPlaybackQueue for GainNode Routing
```typescript
// BEFORE: source.connect(this.audioContext.destination)
// AFTER:  source.connect(this.voiceGain)

export class AudioPlaybackQueue {
  private audioContext: AudioContext;
  private voiceGain: GainNode; // NEW

  constructor(audioContext: AudioContext, voiceGain: GainNode) {
    this.audioContext = audioContext;
    this.voiceGain = voiceGain;
  }

  private playNext(): void {
    // ...existing code...
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.voiceGain); // Changed from audioContext.destination
    // ...rest unchanged...
  }
}
```

### useAmbientAudio Hook
```typescript
// Source: MDN AudioBufferSourceNode + GainNode
"use client";
import { useCallback, useRef, useState } from "react";

const SOUNDSCAPE_URLS: Record<string, string> = {
  rain: "/audio/ambient/rain.mp3",
  ocean: "/audio/ambient/ocean.mp3",
  forest: "/audio/ambient/forest.mp3",
  ambient: "/audio/ambient/ambient.mp3",
  silence: "", // No file -- gain at 0
};

export function useAmbientAudio(audioContext: AudioContext | null, ambientGain: GainNode | null) {
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [activeSoundscape, setActiveSoundscape] = useState<string>("silence");

  const startSoundscape = useCallback(async (key: string) => {
    if (!audioContext || !ambientGain || key === "silence") {
      setActiveSoundscape(key);
      return;
    }

    // Stop previous soundscape
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
    }

    const url = SOUNDSCAPE_URLS[key];
    if (!url) return;

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = true;
    source.connect(ambientGain);
    source.start();

    sourceRef.current = source;
    setActiveSoundscape(key);
  }, [audioContext, ambientGain]);

  const stopSoundscape = useCallback(() => {
    sourceRef.current?.stop();
    sourceRef.current = null;
    setActiveSoundscape("silence");
  }, []);

  return { startSoundscape, stopSoundscape, activeSoundscape };
}
```

### Volume Mixer Component
```typescript
// Source: MDN GainNode smooth transitions
"use client";

interface VolumeMixerProps {
  voiceGain: GainNode | null;
  ambientGain: GainNode | null;
}

function setVolume(gainNode: GainNode, value: number): void {
  const now = gainNode.context.currentTime;
  gainNode.gain.setValueAtTime(gainNode.gain.value, now);
  gainNode.gain.linearRampToValueAtTime(value, now + 0.05);
}

export function VolumeMixer({ voiceGain, ambientGain }: VolumeMixerProps) {
  return (
    <div className="flex flex-col gap-3 px-4">
      <label className="flex items-center gap-2 text-xs text-cream/50">
        Voice
        <input
          type="range"
          min={0}
          max={100}
          defaultValue={100}
          className="flex-1 accent-rose"
          onChange={(e) => voiceGain && setVolume(voiceGain, Number(e.target.value) / 100)}
        />
      </label>
      <label className="flex items-center gap-2 text-xs text-cream/50">
        Ambient
        <input
          type="range"
          min={0}
          max={100}
          defaultValue={30}
          className="flex-1 accent-blush"
          onChange={(e) => ambientGain && setVolume(ambientGain, Number(e.target.value) / 100)}
        />
      </label>
    </div>
  );
}
```

### WebSocket Message Extension for Mood + Voice
```typescript
// Extend ClientMessage in message-types.ts
export type ClientMessage =
  | {
      type: "start_session";
      prompt?: string;
      sessionLength?: number;
      mood?: string;     // NEW: "anxious" | "sad" | "stressed" | "neutral" | "restless"
      voiceId?: string;  // NEW: ElevenLabs voice ID override
    }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "end" };
```

### ElevenLabs Voice Options Config
```typescript
// Extend elevenlabs-client.ts with curated voice options

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  preview: string; // Short description for UI
}

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: "LcfcDJNUP1GQjkzn1xUU",
    name: "Emily",
    description: "Calm meditation voice",
    preview: "Soft & meditative",
  },
  {
    id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    description: "Calm narration voice",
    preview: "Warm & steady",
  },
  {
    id: "JBFqnCBsd6RMkjVDRZzb",
    name: "George",
    description: "Raspy narration voice",
    preview: "Deep & grounding",
  },
];

// Default voice (backward compatible -- currently George)
export const DEFAULT_VOICE_ID = VOICE_OPTIONS[0].id; // Switch default to Emily
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ElevenLabs "premade" voices | ElevenLabs "default" voices | 2024-2025 | Terminology change; same voices, same IDs. API still uses "premade" filter. |
| createGain() factory method | new GainNode() constructor | Supported since 2015 | Either works; factory method is more common in examples |
| HTML5 Audio for background music | AudioBufferSourceNode for ambient loops | Best practice since Web Audio API v1 | AudioBufferSourceNode integrates with GainNode graph; HTML5 Audio cannot |

**Deprecated/outdated:**
- ElevenLabs `eleven_monolingual_v1` model: Replaced by `eleven_flash_v2_5` and `eleven_multilingual_v2`. Project already uses `eleven_flash_v2_5`.

## Open Questions

1. **Ambient soundscape file licensing**
   - What we know: Multiple sources offer CC-licensed ambient loops (Freesound, Mixkit, ambient-mixer.com). Files should be 30-60 seconds, seamlessly looped, ~128kbps MP3.
   - What's unclear: Specific files to use. Need to download, test loop points, and verify license terms for commercial use.
   - Recommendation: Use Freesound.org (CC0 license filter) or Mixkit (free license for commercial use). Download 4 files (rain, ocean, forest, ambient drone), test loop seams, trim if needed.

2. **Optimal voice settings per curated voice**
   - What we know: Current TTS_CONFIG.voiceSettings (stability 0.7, similarityBoost 0.75, style 0.3, speed 0.95) is tuned for George. Different voices may need different settings.
   - What's unclear: Whether Emily and Rachel perform well with the same settings or need per-voice tuning.
   - Recommendation: Start with same settings for all voices. If quality differs, add per-voice voiceSettings overrides to VOICE_OPTIONS config. Test each voice with a sample session before shipping.

3. **Post-session aftercare: static vs LLM-generated reflection**
   - What we know: Grounding exercises should be static (reliable, no API cost, instant). Reflection prompts could be personalized by mood and session content.
   - What's unclear: Whether LLM-generated personalized reflection adds enough value to justify the added complexity and API cost.
   - Recommendation: v1 uses static grounding exercises and static reflection prompts (randomly selected). Defer LLM-generated reflection to v2. Simpler, cheaper, faster.

## Sources

### Primary (HIGH confidence)
- [MDN GainNode](https://developer.mozilla.org/en-US/docs/Web/API/GainNode) - Volume control, smooth transitions, audio graph routing
- [MDN AudioBufferSourceNode.loop](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/loop) - Seamless audio looping with loopStart/loopEnd
- [MDN AudioBufferSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode) - Buffer properties, loop control, GainNode integration
- [ElevenLabs Premade Voices](https://elevenlabs-sdk.mintlify.app/voices/premade-voices) - Complete voice ID list with 45 premade voices including Emily, Rachel, George
- [ElevenLabs TTS API](https://elevenlabs.io/docs/api-reference/text-to-speech/convert) - voice_settings params (stability, similarityBoost, style, speed)
- Existing codebase: `src/hooks/use-audio-queue.ts`, `src/lib/tts/elevenlabs-client.ts`, `src/lib/tts/tts-service.ts`

### Secondary (MEDIUM confidence)
- [ElevenLabs Voice Library categories](https://elevenlabs.io/voice-library/meditation) - Meditation, calm, soothing, warm voice categories
- [ElevenLabs Voices overview](https://elevenlabs.io/docs/overview/capabilities/voices) - Default voices documentation, voice design capabilities
- [Next.js public folder](https://nextjs.org/docs/pages/api-reference/file-conventions/public-folder) - Static asset serving for audio files

### Tertiary (LOW confidence)
- [Freesound.org ambient packs](https://freesound.org/people/Luftrum/packs/3069/) - CC-licensed ambient nature soundscapes (needs per-file license verification)
- [Mixkit ambience sounds](https://mixkit.co/free-sound-effects/ambience/) - Free ambient sound effects with commercial-use license

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Web Audio API GainNode and AudioBufferSourceNode are browser-native, well-documented, widely supported. ElevenLabs voice IDs verified from official SDK docs.
- Architecture: HIGH - All patterns build on existing codebase infrastructure (AudioPlaybackQueue, TTS service, orchestrator, PreSessionFlow). Changes are additive, not structural.
- Pitfalls: HIGH - Web Audio API gotchas (autoplay policy, click artifacts, memory) are well-documented on MDN. ElevenLabs voice ID stability is the only medium-confidence concern.

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (30 days -- stable domain, mature APIs)
