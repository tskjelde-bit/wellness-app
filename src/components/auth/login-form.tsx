"use client";

import { useActionState } from "react";
import { signInAction } from "@/actions/auth";
import Link from "next/link";

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(signInAction, null);

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
      <h2 className="mb-6 text-center text-2xl font-semibold text-charcoal">
        Welcome Back
      </h2>

      {state?.error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
          {state.error}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-charcoal"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-blush bg-cream px-4 py-2.5 text-charcoal placeholder-charcoal/40 outline-none focus:border-rose focus:ring-2 focus:ring-rose/20"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-charcoal"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            className="w-full rounded-lg border border-blush bg-cream px-4 py-2.5 text-charcoal placeholder-charcoal/40 outline-none focus:border-rose focus:ring-2 focus:ring-rose/20"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 w-full rounded-lg bg-rose px-4 py-2.5 font-medium text-white transition-colors hover:bg-rose/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-charcoal/60">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-rose hover:text-rose/80"
        >
          Register
        </Link>
      </p>
    </div>
  );
}
