"use client";

interface BreathingOrbProps {
  isPlaying: boolean;
}

export function BreathingOrb({ isPlaying }: BreathingOrbProps) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring */}
      <div
        className={`absolute h-48 w-48 rounded-full bg-gray-200/50 ${isPlaying ? "animate-pulse-soft" : ""
          } motion-reduce:animate-none`}
      />
      {/* Inner breathing orb */}
      <div
        className={`h-32 w-32 rounded-full bg-gradient-to-br from-gray-800 to-black ${isPlaying ? "animate-breathe" : "opacity-70"
          } motion-reduce:animate-none`}
      />
    </div>
  );
}
