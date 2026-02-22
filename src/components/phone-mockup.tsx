interface PhoneMockupProps {
  children: React.ReactNode;
}

export function PhoneMockup({ children }: PhoneMockupProps) {
  return (
    <div className="relative mx-auto w-[375px] max-w-[90vw] aspect-[375/812] rounded-[3rem] bg-white shadow-[0_0_60px_rgba(255,255,255,0.08)] border border-white/20">
      {/* Status / top bar */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2">
        {/* Back arrow */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className="text-gray-400"
        >
          <path
            d="M12.5 15L7.5 10L12.5 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Dynamic Island / notch */}
        <div className="h-[28px] w-[120px] rounded-full bg-black" />

        {/* Spacer for symmetry */}
        <div className="w-5" />
      </div>

      {/* Content area */}
      <div className="h-[calc(100%-56px)] overflow-hidden px-1 pb-1">
        <div className="h-full overflow-y-auto rounded-b-[2.5rem] bg-white">
          {children}
        </div>
      </div>
    </div>
  );
}
