"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { recordSensoryConsent } from "@/actions/consent";
import { BreathingOrb } from "@/components/session/breathing-orb";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PreSessionFlowProps {
  onBegin: (options: {
    sessionLength: number;
    sensoryConsent: boolean;
  }) => void;
}

type Step = "length" | "consent";

const LENGTH_OPTIONS = [10, 15, 20, 30] as const;

// ---------------------------------------------------------------------------
// PreSessionFlow
// ---------------------------------------------------------------------------

export function PreSessionFlow({ onBegin }: PreSessionFlowProps) {
  const [step, setStep] = useState<Step>("length");
  const [selectedLength, setSelectedLength] = useState(15);

  // Server action for sensory consent audit trail
  const [consentState, consentAction, isConsentPending] = useActionState(
    recordSensoryConsent,
    null
  );

  // When consent server action succeeds, fire onBegin with consent=true
  useEffect(() => {
    if (consentState?.success) {
      onBegin({ sessionLength: selectedLength, sensoryConsent: true });
    }
  }, [consentState?.success, onBegin, selectedLength]);

  const handleSkipSensory = useCallback(() => {
    onBegin({ sessionLength: selectedLength, sensoryConsent: false });
  }, [onBegin, selectedLength]);

  // -------------------------------------------------------------------
  // Step 1: Length Selection
  // -------------------------------------------------------------------

  if (step === "length") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-charcoal px-4 safe-area-padding">
        <div className="flex w-full max-w-sm flex-col items-center gap-8">
          <div className="text-center">
            <h2 className="text-lg font-medium text-cream/80">
              Choose Your Session
            </h2>
            <p className="mt-1 text-sm text-cream/50">
              How long would you like to relax?
            </p>
          </div>

          {/* 2x2 grid of duration options */}
          <div className="grid w-full grid-cols-2 gap-3">
            {LENGTH_OPTIONS.map((minutes) => (
              <button
                key={minutes}
                onClick={() => setSelectedLength(minutes)}
                className={`min-h-[56px] rounded-xl text-base font-medium transition-colors ${
                  selectedLength === minutes
                    ? "bg-rose text-white"
                    : "bg-cream/10 text-cream/70 hover:bg-cream/15"
                }`}
              >
                {minutes} min
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep("consent")}
            className="w-full max-w-xs rounded-lg bg-rose py-3 font-medium text-white transition-colors hover:bg-rose/90 active:scale-[0.98]"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // Step 2: Conversational Consent
  // -------------------------------------------------------------------

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-charcoal px-4 safe-area-padding">
      {/* Ambient breathing orb (static, decorative) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
        <BreathingOrb isPlaying={false} />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8">
        <div className="space-y-4 text-center">
          <p className="text-sm leading-relaxed text-cream/60">
            Before we begin, I want you to know &mdash; I&apos;m an AI wellness
            guide, here to help you relax. This isn&apos;t therapy, just a
            moment of calm.
          </p>
          <p className="text-sm leading-relaxed text-cream/60">
            This session may include body awareness and sensory guidance &mdash;
            gentle attention to breath, physical sensations, and relaxation.
          </p>
        </div>

        {/* Error from consent action */}
        {consentState?.error && (
          <div className="w-full rounded-lg bg-rose/20 p-3 text-center text-sm text-cream/80">
            {consentState.error}
          </div>
        )}

        <div className="flex w-full flex-col items-center gap-3">
          {/* Primary: consent + begin */}
          <form action={consentAction} className="w-full max-w-xs">
            <input type="hidden" name="consent" value="true" />
            <button
              type="submit"
              disabled={isConsentPending}
              className="w-full rounded-lg bg-rose py-3 font-medium text-white transition-colors hover:bg-rose/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isConsentPending ? "Starting..." : "I'm ready to begin"}
            </button>
          </form>

          {/* Secondary: skip sensory content */}
          <button
            type="button"
            onClick={handleSkipSensory}
            className="text-sm text-cream/40 transition-colors hover:text-cream/60"
          >
            Skip sensory content
          </button>
        </div>
      </div>
    </div>
  );
}
