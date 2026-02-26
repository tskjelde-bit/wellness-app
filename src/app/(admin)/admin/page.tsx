"use client";

import { useEffect, useState } from "react";

interface SectionInfo {
  section: string;
  version: number;
  updatedAt: string | null;
  hasDbConfig: boolean;
}

const SECTION_LABELS: Record<string, string> = {
  prompts: "System Prompts & Characters",
  llm_settings: "LLM Settings",
  phase_config: "Phase Configuration",
  phase_prompts: "Phase Prompts",
  mood_prompts: "Mood Prompts",
  safety: "Safety & Guardrails",
  translations: "UI Translations",
  consent: "Consent & Legal",
  voice_options: "Voice Options",
};

const SECTION_ROUTES: Record<string, string> = {
  prompts: "/admin/prompts",
  llm_settings: "/admin/llm-settings",
  phase_config: "/admin/phase-config",
  phase_prompts: "/admin/phase-prompts",
  mood_prompts: "/admin/mood-prompts",
  safety: "/admin/safety",
  translations: "/admin/translations",
  consent: "/admin/consent",
  voice_options: "/admin/voice-options",
};

export default function AdminOverview() {
  const [sections, setSections] = useState<SectionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((json) => setSections(json.sections))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Admin Overview
      </h1>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <a
              key={s.section}
              href={SECTION_ROUTES[s.section] ?? "#"}
              className="block rounded-lg border border-gray-200 bg-white p-5 hover:border-gray-400 transition-colors"
            >
              <h2 className="font-semibold text-gray-900 mb-1">
                {SECTION_LABELS[s.section] ?? s.section}
              </h2>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>v{s.version}</span>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 ${
                    s.hasDbConfig
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {s.hasDbConfig ? "Customized" : "Defaults"}
                </span>
              </div>
              {s.updatedAt && (
                <p className="text-xs text-gray-400 mt-2">
                  Updated: {new Date(s.updatedAt).toLocaleString()}
                </p>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
