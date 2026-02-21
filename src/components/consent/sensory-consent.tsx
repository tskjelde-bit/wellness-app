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
    <div className="w-full max-w-md rounded-2xl bg-charcoal p-8 text-center ring-1 ring-gold/20">
      <h2 className="mb-3 text-xl font-semibold text-cream">
        Klar for rushet?
      </h2>
      <p className="mb-6 text-sm leading-relaxed text-cream/70">
        Denne delen involverer intens kroppsbevissthet og dristige beskrivelser.
        Hun vil guide deg gjennom fysiske sensasjoner og eksplisitt nytelse.
        Du kan trekke deg når som helst.
      </p>

      {(state as { error?: string })?.error && (
        <div className="mb-4 rounded-lg bg-rose/20 p-3 text-center text-sm text-cream/80">
          {(state as { error?: string }).error}
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
            {isPending ? "Bearbeider..." : "Jeg er klar"}
          </button>
        </form>

        <button
          type="button"
          onClick={onSkip}
          className="w-full rounded-lg border border-gold/30 px-4 py-2.5 font-medium text-cream/60 transition-colors hover:bg-gold/10"
        >
          Hopp over for nå
        </button>
      </div>
    </div>
  );
}
