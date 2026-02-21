"use client";

import { useActionState, useEffect } from "react";
import { verifyAge } from "@/actions/consent";
import { useRouter } from "next/navigation";

export default function AgeGate() {
  const [state, formAction, isPending] = useActionState(verifyAge, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.push("/accept-terms");
    }
  }, [state?.success, router]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
      <h2 className="mb-2 text-center text-2xl font-semibold text-charcoal">
        Age Verification
      </h2>
      <p className="mb-6 text-center text-sm text-charcoal/60">
        For your safety and legal compliance, we need to verify that you are 18
        years or older.
      </p>

      {state?.error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
          {state.error}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="dateOfBirth"
            className="mb-1 block text-sm font-medium text-charcoal"
          >
            Date of Birth
          </label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            required
            max={today}
            className="w-full rounded-lg border border-blush bg-cream px-4 py-2.5 text-charcoal outline-none focus:border-rose focus:ring-2 focus:ring-rose/20"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 w-full rounded-lg bg-rose px-4 py-2.5 font-medium text-white transition-colors hover:bg-rose/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Verifying..." : "Verify My Age"}
        </button>
      </form>
    </div>
  );
}
