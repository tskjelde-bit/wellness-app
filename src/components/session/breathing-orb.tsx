"use client";

interface BreathingOrbProps {
  isPlaying: boolean;
}

export function BreathingOrb({ isPlaying }: BreathingOrbProps) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Core breathing orb */}
      <div
        className={`h-32 w-32 rounded-full bg-gradient-to-br from-gray-800 to-black shadow-heavy border border-gray-700 ${isPlaying ? "animate-breathe" : "opacity-70"
          } motion-reduce:animate-none`}
      />
    </div>
  );
}
