"use client";

import { useActionState } from "react";
import { signInAction } from "@/actions/auth";
import Link from "next/link";

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(signInAction, null);

  return (
    <div className="w-full max-w-md rounded-2xl bg-charcoal p-8 shadow-fetish ring-1 ring-gold/20">
      <h2 className="mb-6 text-center text-2xl font-semibold text-cream">
        Velkommen tilbake
      </h2>

      {(state as { error?: string })?.error && (
        <div className="mb-4 rounded-lg bg-rose/20 p-3 text-center text-sm text-cream/80 border border-rose/30">
          {(state as { error?: string }).error}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-cream/70"
          >
            E-post
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-gold/10 bg-black/40 px-4 py-2.5 text-cream placeholder-cream/20 outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/10"
            placeholder="din@epost.no"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-cream/70"
          >
            Passord
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            className="w-full rounded-lg border border-gold/10 bg-black/40 px-4 py-2.5 text-cream placeholder-cream/20 outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/10"
            placeholder="Ditt passord"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 w-full rounded-lg bg-rose px-4 py-3 font-medium text-white transition-all hover:bg-rose/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Logger inn..." : "Logg inn"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-cream/40">
        Har du ikke bruker?{" "}
        <Link
          href="/register"
          className="font-medium text-gold hover:text-gold/80 transition-colors"
        >
          Registrer deg her
        </Link>
      </p>
    </div>
  );
}
