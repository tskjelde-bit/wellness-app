"use client";

import { useState } from "react";

const LANGUAGES = [
  { code: "no", label: "NO" },
  { code: "en", label: "EN" },
  { code: "sv", label: "SV" },
] as const;

type Lang = "no" | "en" | "sv";

interface LangTabsProps {
  children: (lang: Lang) => React.ReactNode;
  defaultLang?: Lang;
}

export function LangTabs({ children, defaultLang = "no" }: LangTabsProps) {
  const [activeLang, setActiveLang] = useState<Lang>(defaultLang);

  return (
    <div>
      <div className="flex gap-1 border-b border-gray-200 mb-4">
        {LANGUAGES.map(({ code, label }) => (
          <button
            key={code}
            onClick={() => setActiveLang(code)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeLang === code
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {children(activeLang)}
    </div>
  );
}
