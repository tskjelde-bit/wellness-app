"use client";

import { useMemo } from "react";

// ---------------------------------------------------------------------------
// PostSessionScreen -- aftercare content with grounding & reflection
// ---------------------------------------------------------------------------

interface PostSessionScreenProps {
  onDone: () => void;
}

// Static grounding exercises drawn from research
const GROUNDING_EXERCISES = [
  {
    title: "5-4-3-2-1 Senses",
    description:
      "Notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. Take your time with each one.",
  },
  {
    title: "Body Check-In",
    description:
      "Starting from the top of your head, slowly scan down through your body. Notice any areas of tension or ease without trying to change anything.",
  },
  {
    title: "Three Breaths",
    description:
      "Take three slow, deep breaths. On each exhale, let your shoulders drop a little further. Feel the weight of your body being supported.",
  },
];

// Static reflection prompts for post-session contemplation
const REFLECTION_PROMPTS = [
  "What felt most calming during your session?",
  "Is there a sensation or image from the session you want to carry with you?",
  "How does your body feel right now compared to when you started?",
  "What is one kind thing you can do for yourself today?",
];

/**
 * Post-session aftercare screen showing a randomly selected grounding
 * exercise and reflection prompt. Provides a gentle transition out of
 * the session experience before returning to the dashboard.
 */
export function PostSessionScreen({ onDone }: PostSessionScreenProps) {
  // Select one random grounding exercise and one reflection prompt on mount
  const exercise = useMemo(
    () => GROUNDING_EXERCISES[Math.floor(Math.random() * GROUNDING_EXERCISES.length)],
    [],
  );
  const prompt = useMemo(
    () => REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)],
    [],
  );

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-white px-4 safe-area-padding animate-fade-in">
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8">
        {/* Heading */}
        <h2 className="text-2xl font-black text-gray-950 uppercase tracking-tighter">
          Sesjonen er ferdig
        </h2>

        {/* Grounding exercise card */}
        <div className="w-full rounded-2xl bg-gradient-to-b from-gray-50 to-gray-100 p-6 shadow-xl border border-gray-200">
          <h3 className="mb-3 text-lg font-black text-gray-900 uppercase tracking-tight">{exercise.title}</h3>
          <p className="text-sm leading-relaxed font-bold text-gray-800">
            {exercise.description}
          </p>
        </div>

        {/* Reflection prompt */}
        <p className="px-4 text-center text-sm italic font-black text-gray-500 uppercase tracking-widest">
          {prompt}
        </p>

        {/* Return to dashboard */}
        <button
          onClick={onDone}
          className="w-full max-w-xs rounded-xl bg-gradient-to-b from-gray-800 to-gray-950 py-3.5 font-bold text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Gå tilbake til oversikten
        </button>
      </div>
    </div>
  );
}
