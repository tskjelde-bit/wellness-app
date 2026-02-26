"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { checkSubscriptionStatus } from "@/actions/payment";

export const dynamic = "force-dynamic";

type ActivationState = "polling" | "active" | "timeout";

export default function SubscribeSuccessPage() {
  const [state, setState] = useState<ActivationState>("polling");

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 8;

    const poll = async () => {
      while (attempts < maxAttempts && !cancelled) {
        try {
          const result = await checkSubscriptionStatus();
          if (result.status === "active") {
            if (!cancelled) setState("active");
            return;
          }
        } catch {
          // Ignore polling errors, will retry
        }
        attempts++;
        if (attempts < maxAttempts && !cancelled) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
      if (!cancelled) setState("timeout");
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center px-6 pt-6 pb-10 bg-white">
      {state === "polling" && (
        <>
          <div className="mt-8 h-16 w-16 rounded-full bg-gradient-to-br from-gray-700 to-black animate-breathe border border-gray-600" />
          <h1 className="mt-6 text-[13px] font-black text-gray-900 uppercase tracking-[0.25em] text-center">
            Behandler betaling...
          </h1>
          <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] text-center">
            Dette tar bare et øyeblikk.
          </p>
        </>
      )}

      {state === "active" && (
        <>
          <div className="mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-6 w-6 text-gray-900"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="mt-6 text-[13px] font-black text-gray-900 uppercase tracking-[0.25em] text-center">
            Abonnementet er aktivt
          </h1>
          <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] text-center">
            Du har nå full tilgang til wellness-sesjoner.
          </p>

          <div className="flex-1" />

          <div className="flex w-full flex-col gap-2.5">
            <Link
              href="/session"
              className="block rounded-xl bg-gradient-to-b from-gray-800 to-gray-950 px-6 py-3 text-[12px] font-black text-white uppercase tracking-[0.15em] text-center transition-all hover:opacity-90 active:scale-[0.97]"
            >
              Start en sesjon
            </Link>
            <Link
              href="/dashboard"
              className="block rounded-xl border-2 border-gray-200 px-6 py-3 text-[12px] font-bold text-gray-500 uppercase tracking-[0.15em] text-center transition-all hover:border-gray-300 hover:text-gray-700 active:scale-[0.97]"
            >
              Gå til Dashboard
            </Link>
          </div>
        </>
      )}

      {state === "timeout" && (
        <>
          <div className="mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-6 w-6 text-gray-900"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="mt-6 text-[13px] font-black text-gray-900 uppercase tracking-[0.25em] text-center">
            Betaling mottatt
          </h1>
          <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] text-center">
            Det kan ta et øyeblikk å aktivere. Sjekk dashboardet.
          </p>

          <div className="flex-1" />

          <Link
            href="/dashboard"
            className="block w-full rounded-xl bg-gradient-to-b from-gray-800 to-gray-950 px-6 py-3 text-[12px] font-black text-white uppercase tracking-[0.15em] text-center transition-all hover:opacity-90 active:scale-[0.97]"
          >
            Gå til Dashboard
          </Link>
        </>
      )}
    </div>
  );
}
