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
    <div className="flex min-h-dvh flex-col items-center justify-center bg-charcoal px-4 safe-area-padding animate-fade-in">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        {/* Heading */}
        <h2 className="text-xl font-medium text-cream/80">
          Your session is complete
        </h2>

        {/* Grounding exercise card */}
        <div className="w-full rounded-xl border border-cream/10 bg-cream/5 p-5">
          <h3 className="mb-2 font-bold text-cream/90">{exercise.title}</h3>
          <p className="text-sm leading-relaxed text-cream/60">
            {exercise.description}
          </p>
        </div>

        {/* Reflection prompt */}
        <p className="px-4 text-center text-sm italic text-cream/50">
          {prompt}
        </p>

        {/* Return to dashboard */}
        <button
          onClick={onDone}
          className="w-full max-w-xs rounded-lg bg-rose py-3 font-medium text-white transition-colors hover:bg-rose/90 active:scale-[0.98]"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
