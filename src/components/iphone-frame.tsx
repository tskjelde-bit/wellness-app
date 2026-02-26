interface IPhoneFrameProps {
  children: React.ReactNode;
}

export function IPhoneFrame({ children }: IPhoneFrameProps) {
  return (
    <div className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-[#060606] px-4">
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[500px] rounded-full bg-white/[0.02] blur-[120px]" />
      </div>

      {/* Phone wireframe */}
      <div className="relative z-10 animate-fade-in">
        {/* Ambient halo behind phone */}
        <div className="pointer-events-none absolute -inset-10 rounded-[4rem] bg-white/[0.015] blur-3xl" />

        <div className="relative w-[300px] max-h-[calc(100dvh-2rem)] aspect-[9/19.5] rounded-[2.8rem] bg-white shadow-[0_4px_80px_rgba(255,255,255,0.05)] border border-white/10 overflow-hidden flex flex-col">
          {/* Dynamic Island */}
          <div className="shrink-0 flex items-center justify-center pt-3.5">
            <div className="h-[24px] w-[100px] rounded-full bg-black" />
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-h-0">
            {children}
          </div>

          {/* Home indicator bar */}
          <div className="pointer-events-none absolute bottom-2.5 left-1/2 -translate-x-1/2 h-[4px] w-[100px] rounded-full bg-gray-200 z-10" />
        </div>
      </div>
    </div>
  );
}
