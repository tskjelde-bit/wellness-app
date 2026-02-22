"use client";

// ---------------------------------------------------------------------------
// VolumeMixer -- independent voice/ambient volume sliders
// ---------------------------------------------------------------------------

interface VolumeMixerProps {
  voiceGain: GainNode | null;
  ambientGain: GainNode | null;
}

/**
 * Set a GainNode's volume with a click-free 50ms linear ramp.
 *
 * Uses setValueAtTime + linearRampToValueAtTime to avoid audible
 * pops/clicks that occur with direct .value assignment.
 */
export function setVolume(gainNode: GainNode, value: number): void {
  const now = gainNode.context.currentTime;
  gainNode.gain.setValueAtTime(gainNode.gain.value, now);
  gainNode.gain.linearRampToValueAtTime(value, now + 0.05);
}

/**
 * Compact volume mixer with two range sliders for independent
 * voice and ambient volume control.
 *
 * Renders nothing until at least one GainNode is available
 * (i.e., after AudioContext has been initialized via user gesture).
 */
export function VolumeMixer({ voiceGain, ambientGain }: VolumeMixerProps) {
  if (!voiceGain && !ambientGain) return null;

  return (
    <div className="flex flex-col gap-2 w-full max-w-[200px]">
      <label className="flex items-center gap-2 text-xs font-bold text-gray-600">
        <span className="w-14 shrink-0">Stemme</span>
        <input
          type="range"
          min={0}
          max={100}
          defaultValue={100}
          className="flex-1 accent-rose-500"
          onChange={(e) =>
            voiceGain && setVolume(voiceGain, Number(e.target.value) / 100)
          }
        />
      </label>
      <label className="flex items-center gap-2 text-xs font-bold text-gray-600">
        <span className="w-14 shrink-0">Bakgrunn</span>
        <input
          type="range"
          min={0}
          max={100}
          defaultValue={30}
          className="flex-1 accent-rose-500"
          onChange={(e) =>
            ambientGain && setVolume(ambientGain, Number(e.target.value) / 100)
          }
        />
      </label>
    </div>
  );
}
