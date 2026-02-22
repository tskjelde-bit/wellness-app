export default function Home() {
  return (
    <div className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-[#060606] px-4">
      {/* ── Background atmosphere ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[500px] rounded-full bg-white/[0.02] blur-[120px]" />
      </div>

      {/* ── Phone wireframe with ALL content inside ── */}
      <div className="relative z-10 animate-fade-in">
        {/* Ambient halo behind phone */}
        <div className="pointer-events-none absolute -inset-10 rounded-[4rem] bg-white/[0.015] blur-3xl" />

        <div className="relative w-[300px] max-h-[calc(100dvh-2rem)] aspect-[9/19.5] rounded-[2.8rem] bg-white shadow-[0_4px_80px_rgba(255,255,255,0.05)] border border-white/10 overflow-hidden">
          {/* Dynamic Island */}
          <div className="flex items-center justify-center pt-3.5">
            <div className="h-[24px] w-[100px] rounded-full bg-black" />
          </div>

          {/* ── All content inside phone ── */}
          <div className="flex flex-col items-center h-[calc(100%-42px)] px-6 pt-6 pb-10">
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
              <a
                href="https://tskjelde-bit.github.io/wellness-app/"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-gray-300 px-6 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] text-center transition-all hover:border-gray-400 hover:text-gray-600 active:scale-[0.97]"
              >
                Prosjekt Dashboard
              </a>
            </div>
          </div>

          {/* Home indicator bar */}
          <div className="pointer-events-none absolute bottom-2.5 left-1/2 -translate-x-1/2 h-[4px] w-[100px] rounded-full bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
