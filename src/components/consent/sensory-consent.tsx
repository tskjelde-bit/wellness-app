"use client";

import { useActionState, useEffect } from "react";
import { recordSensoryConsent } from "@/actions/consent";

interface SensoryConsentProps {
  onConsent?: () => void;
  onSkip?: () => void;
}

export function SensoryConsent({ onConsent, onSkip }: SensoryConsentProps) {
  const [state, formAction, isPending] = useActionState(
    recordSensoryConsent,
    null
  );

  useEffect(() => {
    if (state?.success) {
      onConsent?.();
    }
  }, [state?.success, onConsent]);

  return (
    <div className="w-full max-w-md rounded-2xl bg-cream p-8 text-center">
      <h2 className="mb-3 text-xl font-semibold text-charcoal">
        Sensory Content Consent
      </h2>
      <p className="mb-6 text-sm leading-relaxed text-charcoal/70">
        The next part of your session involves body awareness and sensory
        guidance. This may include references to physical sensations, breathing
        awareness, and gentle body-focused relaxation. You can skip this section
        at any time.
      </p>

      {state?.error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <form action={formAction}>
          <input type="hidden" name="consent" value="true" />
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-rose px-4 py-2.5 font-medium text-white transition-colors hover:bg-rose/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Processing..." : "I'm Ready"}
          </button>
        </form>

        <button
          type="button"
          onClick={onSkip}
          className="w-full rounded-lg border border-blush px-4 py-2.5 font-medium text-charcoal/60 transition-colors hover:bg-blush/30"
        >
          Skip This Section
        </button>
      </div>
    </div>
  );
}
