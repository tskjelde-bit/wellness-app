export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 pt-6 pb-10">
      {/* Breathing orb */}
      <div className="relative mt-4">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-700 to-black animate-breathe border border-gray-600 shadow-heavy" />
        <div className="pointer-events-none absolute inset-[-8px] rounded-full bg-gray-400/10 blur-2xl animate-pulse-soft" />
      </div>

      {/* App title */}
      <h1 className="mt-7 text-[13px] font-black text-gray-900 uppercase tracking-[0.25em]">
        Wellness App
      </h1>

      {/* Tagline */}
      <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] text-center leading-relaxed">
        Stemmestyrt velvære for ro,
        <br />
        nærvær og tilkobling.
      </p>

      {/* Spacer */}
      <div className="flex-1" />

      {/* CTA Buttons */}
      <div className="relative z-10 flex flex-col gap-2.5 w-full">
        <a
          href="/login"
          className="block rounded-xl bg-gradient-to-b from-gray-800 to-gray-950 px-6 py-3 text-[12px] font-black text-white uppercase tracking-[0.15em] text-center transition-all hover:opacity-90 active:scale-[0.97]"
        >
          Logg inn
        </a>
        <a
          href="/register"
          className="block rounded-xl border-2 border-gray-200 px-6 py-3 text-[12px] font-bold text-gray-500 uppercase tracking-[0.15em] text-center transition-all hover:border-gray-300 hover:text-gray-700 active:scale-[0.97]"
        >
          Registrer
        </a>
      </div>
    </div>
  );
}
