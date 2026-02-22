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
    <div className="w-full max-w-md rounded-2xl bg-gradient-to-b from-gray-50 to-gray-100 p-8 shadow-heavy border border-gray-200">
      <h2 className="mb-2 text-center text-3xl font-black text-gray-950 uppercase tracking-tighter">
        Vilkår & Personvern
      </h2>
      <p className="mb-6 text-center text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
        Vennligst gå gjennom og godta våre vilkår og personvernerklæring før du fortsetter.
      </p>

      {state?.error && (
        <div className="mb-4 rounded-lg bg-gray-50 p-3 text-center text-sm font-bold text-gray-900 border border-gray-200">
          {state.error}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3">
        <Link
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-black uppercase tracking-widest text-gray-900 hover:underline underline-offset-8 decoration-gray-300 transition-all"
        >
          Les brukervilkårene
        </Link>
        <Link
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-black uppercase tracking-widest text-gray-900 hover:underline underline-offset-8 decoration-gray-300 transition-all"
        >
          Les personvernerklæringen
        </Link>
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            name="tosAccepted"
            value="true"
            checked={tosChecked}
            onChange={(e) => setTosChecked(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 text-black accent-black transition-all"
          />
          <span className="text-sm font-bold text-gray-800 uppercase tracking-tight group-hover:text-black">
            Jeg godtar brukervilkårene
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            name="privacyAccepted"
            value="true"
            checked={privacyChecked}
            onChange={(e) => setPrivacyChecked(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 text-black accent-black transition-all"
          />
          <span className="text-sm font-bold text-gray-800 uppercase tracking-tight group-hover:text-black">
            Jeg godtar personvernerklæringen
          </span>
        </label>

        <button
          type="submit"
          disabled={isPending || !bothChecked}
          className="mt-2 w-full rounded-xl bg-gradient-to-b from-gray-800 to-gray-950 px-4 py-4 font-black text-white uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Behandler..." : "Godta & Fortsett"}
        </button>
      </form>
    </div>
  );
}
