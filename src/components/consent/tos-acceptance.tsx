"use client";

import { useActionState, useEffect, useState } from "react";
import { acceptTerms } from "@/actions/consent";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TosAcceptance() {
  const [state, formAction, isPending] = useActionState(acceptTerms, null);
  const router = useRouter();
  const [tosChecked, setTosChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  useEffect(() => {
    if (state?.success) {
      router.push("/dashboard");
    }
  }, [state?.success, router]);

  const bothChecked = tosChecked && privacyChecked;

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
      <h2 className="mb-2 text-center text-2xl font-semibold text-charcoal">
        Terms & Privacy
      </h2>
      <p className="mb-6 text-center text-sm text-charcoal/60">
        Please review and accept our terms of service and privacy policy before
        continuing.
      </p>

      {state?.error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
          {state.error}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3">
        <Link
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-rose hover:text-rose/80 underline"
        >
          Read Terms of Service
        </Link>
        <Link
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-rose hover:text-rose/80 underline"
        >
          Read Privacy Policy
        </Link>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="tosAccepted"
            value="true"
            checked={tosChecked}
            onChange={(e) => setTosChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-blush text-rose accent-rose"
          />
          <span className="text-sm text-charcoal">
            I accept the Terms of Service
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="privacyAccepted"
            value="true"
            checked={privacyChecked}
            onChange={(e) => setPrivacyChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-blush text-rose accent-rose"
          />
          <span className="text-sm text-charcoal">
            I accept the Privacy Policy
          </span>
        </label>

        <button
          type="submit"
          disabled={isPending || !bothChecked}
          className="mt-2 w-full rounded-lg bg-rose px-4 py-2.5 font-medium text-white transition-colors hover:bg-rose/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Processing..." : "Accept & Continue"}
        </button>
      </form>
    </div>
  );
}
