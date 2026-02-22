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
    <div className="w-full max-w-md rounded-2xl bg-gradient-to-b from-gray-50 to-gray-100 p-8 shadow-heavy border border-gray-200">
      <h2 className="mb-2 text-center text-3xl font-black text-gray-950 uppercase tracking-tighter">
        Verifiser alder
      </h2>
      <p className="mb-6 text-center text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
        For din sikkerhet og for å følge loven, må vi bekrefte at du er 18 år eller eldre.
      </p>

      {state?.error && (
        <div className="mb-4 rounded-lg bg-gray-50 p-3 text-center text-sm font-bold text-gray-900 border border-gray-200">
          {state.error}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-5">
        <div>
          <label
            htmlFor="dateOfBirth"
            className="mb-1.5 block text-xs font-black uppercase tracking-widest text-gray-400"
          >
            Fødselsdato
          </label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            required
            max={today}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 font-bold outline-none focus:border-black focus:ring-4 focus:ring-gray-100 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 w-full rounded-xl bg-gradient-to-b from-gray-800 to-gray-950 px-4 py-4 font-black text-white uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Verifiserer..." : "Bekreft alder"}
        </button>
      </form>
    </div>
  );
}
