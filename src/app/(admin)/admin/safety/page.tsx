"use client";

import { useAdminConfig } from "@/components/admin/use-admin-config";
import { SaveBar } from "@/components/admin/save-bar";
import { LangTabs } from "@/components/admin/editors/lang-tabs";
import { TextareaEditor } from "@/components/admin/editors/textarea-editor";
import { ListEditor } from "@/components/admin/editors/list-editor";
import type { SafetyConfig } from "@/lib/admin/config-sections";

export default function SafetyPage() {
  const { data, setData, loading, saving, error, version, source, save } =
    useAdminConfig<SafetyConfig>({ section: "safety" });

  if (loading || !data) return <p className="text-gray-500">Loading...</p>;

  const updateSafetyPrompt = (lang: string, value: string) => {
    setData({
      ...data,
      safetyPrompts: { ...data.safetyPrompts, [lang]: value },
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

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Safety & Guardrails
      </h1>

      <div className="max-w-2xl">
        <div className="mb-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={data.enableGuardrails ?? false}
              onChange={(e) =>
                setData({ ...data, enableGuardrails: e.target.checked })
              }
              className="rounded border-gray-300"
            />
            <span className="font-medium text-gray-700">
              Enable guardrails
            </span>
          </label>
        </div>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Safety System Prompts
          </h2>
          <LangTabs>
            {(lang) => (
              <TextareaEditor
                label={`Safety prompt (${lang.toUpperCase()})`}
                value={data.safetyPrompts?.[lang] ?? ""}
                onChange={(v) => updateSafetyPrompt(lang, v)}
                rows={6}
              />
            )}
          </LangTabs>
        </section>

        <section className="mb-8">
          <ListEditor
            label="Blocked Keywords"
            items={data.blockedKeywords ?? []}
            onChange={(items) => setData({ ...data, blockedKeywords: items })}
            description="Keywords that will be filtered from output"
            placeholder="Add keyword..."
          />
        </section>
      </div>
    </div>
  );
}
