"use client";

import { useActionState } from "react";
import { signUp } from "@/actions/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState(signUp, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.push("/login");
    }
  }, [state?.success, router]);

  return (
    <div className="w-full max-w-md rounded-2xl bg-gradient-to-b from-gray-50 to-gray-100 p-8 shadow-heavy border border-gray-200">
      <h2 className="mb-6 text-center text-3xl font-black text-gray-950 uppercase tracking-tighter">
        Opprett konto
      </h2>

      {(state as { error?: string })?.error && (
        <div className="mb-4 rounded-lg bg-gray-50 p-3 text-center text-sm font-bold text-gray-900 border border-gray-200">
          {(state as { error?: string }).error}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-5">
        <div>
          <label
            htmlFor="name"
            className="mb-1.5 block text-xs font-black uppercase tracking-widest text-gray-400"
          >
            Navn
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 font-bold placeholder-gray-300 outline-none focus:border-black focus:ring-4 focus:ring-gray-100 transition-all"
            placeholder="Ditt navn"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-xs font-black uppercase tracking-widest text-gray-400"
          >
            E-post
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 font-bold placeholder-gray-300 outline-none focus:border-black focus:ring-4 focus:ring-gray-100 transition-all"
            placeholder="din@epost.no"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-black uppercase tracking-widest text-gray-400"
          >
            Passord
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 font-bold placeholder-gray-300 outline-none focus:border-black focus:ring-4 focus:ring-gray-100 transition-all"
            placeholder="Minst 8 tegn"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 w-full rounded-xl bg-gradient-to-b from-gray-800 to-gray-950 px-4 py-4 font-black text-white uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Oppretter..." : "Opprett konto"}
        </button>
      </form>

      <p className="mt-8 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
        Har du allerede konto?{" "}
        <Link
          href="/login"
          className="font-black text-gray-950 hover:underline underline-offset-4 transition-all"
        >
          Logg inn
        </Link>
      </p>

      <a
        href="https://tskjelde-bit.github.io/wellness-app/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 block w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-widest transition-all hover:border-gray-400 hover:text-gray-600 active:scale-[0.98]"
      >
        Prosjekt Dashboard
      </a>
    </div>
  );
}
