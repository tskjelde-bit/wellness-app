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
    const maxAttempts = 8; // 8 attempts * 2s = 16s max

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
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-cream to-blush-light px-4">
      <div className="w-full max-w-md rounded-[--radius-card] bg-white p-8 text-center shadow-soft">
        {state === "polling" && (
          <>
            <div className="mx-auto mb-6 h-12 w-12 animate-pulse rounded-full bg-rose/20" />
            <h1 className="mb-2 text-2xl font-semibold text-charcoal">
              Processing your payment...
            </h1>
            <p className="text-charcoal/60">
              This will only take a moment.
            </p>
          </>
        )}

        {state === "active" && (
          <>
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-rose/10">
              <svg
                className="h-6 w-6 text-rose"
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
            <h1 className="mb-2 text-2xl font-semibold text-charcoal">
              Welcome! Your subscription is active.
            </h1>
            <p className="mb-8 text-charcoal/60">
              You now have full access to personalized wellness sessions.
            </p>
            <div className="space-y-3">
              <Link
                href="/session"
                className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-rose px-4 py-3 font-medium text-white transition-colors hover:bg-rose-dark active:scale-[0.98]"
              >
                Start a Session
              </Link>
              <Link
                href="/dashboard"
                className="flex min-h-[44px] w-full items-center justify-center rounded-lg border border-charcoal/20 px-4 py-3 font-medium text-charcoal/60 transition-colors hover:border-charcoal/40 hover:text-charcoal"
              >
                Go to Dashboard
              </Link>
            </div>
          </>
        )}

        {state === "timeout" && (
          <>
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-rose/10">
              <svg
                className="h-6 w-6 text-rose"
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
            <h1 className="mb-2 text-2xl font-semibold text-charcoal">
              Payment received!
            </h1>
            <p className="mb-8 text-charcoal/60">
              It may take a moment to activate. You can check your dashboard.
            </p>
            <Link
              href="/dashboard"
              className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-rose px-4 py-3 font-medium text-white transition-colors hover:bg-rose-dark active:scale-[0.98]"
            >
              Go to Dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
