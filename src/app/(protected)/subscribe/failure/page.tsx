import Link from "next/link";

export const dynamic = "force-dynamic";

export default function SubscribeFailurePage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 pt-6 pb-10 bg-white">
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>

      <h1 className="mt-6 text-[13px] font-black text-gray-900 uppercase tracking-[0.25em] text-center">
        Noe gikk galt
      </h1>
      <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] text-center leading-relaxed">
        Ingen bekymring &mdash; du ble ikke belastet.
        <br />
        Du kan prøve igjen når du er klar.
      </p>

      <div className="flex-1" />

      <div className="flex w-full flex-col gap-2.5">
        <Link
          href="/subscribe"
          className="block rounded-xl bg-gradient-to-b from-gray-800 to-gray-950 px-6 py-3 text-[12px] font-black text-white uppercase tracking-[0.15em] text-center transition-all hover:opacity-90 active:scale-[0.97]"
        >
          Prøv igjen
        </Link>
        <Link
          href="/dashboard"
          className="block rounded-xl border-2 border-gray-200 px-6 py-3 text-[12px] font-bold text-gray-500 uppercase tracking-[0.15em] text-center transition-all hover:border-gray-300 hover:text-gray-700 active:scale-[0.97]"
        >
          Tilbake til Dashboard
        </Link>
      </div>
    </div>
  );
}
