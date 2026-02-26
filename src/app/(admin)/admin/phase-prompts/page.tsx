"use client";

import { useAdminConfig } from "@/components/admin/use-admin-config";
import { SaveBar } from "@/components/admin/save-bar";
import { LangTabs } from "@/components/admin/editors/lang-tabs";
import { TextareaEditor } from "@/components/admin/editors/textarea-editor";
import type { PhasePromptsConfig } from "@/lib/admin/config-sections";

const PHASES = ["atmosphere", "breathing", "sensory", "relaxation", "resolution"] as const;

export default function PhasePromptsPage() {
  const { data, setData, loading, saving, error, version, source, save } =
    useAdminConfig<PhasePromptsConfig>({ section: "phase_prompts" });

  if (loading || !data) return <p className="text-gray-500">Loading...</p>;

  const updatePhasePrompt = (lang: string, phase: string, value: string) => {
    setData({
      ...data,
      phasePrompts: {
        ...data.phasePrompts,
        [lang]: { ...(data.phasePrompts?.[lang as keyof typeof data.phasePrompts] ?? {}), [phase]: value },
      },
    });
  };

  const updateTransitionHint = (lang: string, phase: string, value: string) => {
    setData({
      ...data,
      transitionHints: {
        ...data.transitionHints,
        [lang]: { ...(data.transitionHints?.[lang as keyof typeof data.transitionHints] ?? {}), [phase]: value },
      },
    });
  };

  return (
    <div>
      <SaveBar
        onSave={() => save(data)}
        saving={saving}
        error={error}
        version={version}
        source={source}
      />

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Phase Prompts</h1>

      {PHASES.map((phase) => (
        <section
          key={phase}
          className="mb-8 rounded-lg border border-gray-200 p-4"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-3 capitalize">
            {phase}
          </h2>

          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Phase Instructions
            </h3>
            <LangTabs>
              {(lang) => (
                <TextareaEditor
                  label={`${phase} instructions (${lang.toUpperCase()})`}
                  value={
                    (data.phasePrompts?.[lang as keyof typeof data.phasePrompts] as Record<string, string>)?.[phase] ?? ""
                  }
                  onChange={(v) => updatePhasePrompt(lang, phase, v)}
                  rows={8}
                />
              )}
            </LangTabs>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Transition Hint
            </h3>
            <LangTabs>
              {(lang) => (
                <TextareaEditor
                  label={`${phase} transition (${lang.toUpperCase()})`}
                  value={
                    (data.transitionHints?.[lang as keyof typeof data.transitionHints] as Record<string, string>)?.[phase] ?? ""
                  }
                  onChange={(v) => updateTransitionHint(lang, phase, v)}
                  rows={3}
                />
              )}
            </LangTabs>
          </div>
        </section>
      ))}
    </div>
  );
}
