"use client";

import { useAdminConfig } from "@/components/admin/use-admin-config";
import { SaveBar } from "@/components/admin/save-bar";
import { TextFieldEditor } from "@/components/admin/editors/text-field-editor";
import { NumberFieldEditor } from "@/components/admin/editors/number-field-editor";
import type { LlmSettingsConfig } from "@/lib/admin/config-sections";

export default function LlmSettingsPage() {
  const { data, setData, loading, saving, error, version, source, save } =
    useAdminConfig<LlmSettingsConfig>({ section: "llm_settings" });

  if (loading || !data) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <SaveBar
        onSave={() => save(data)}
        saving={saving}
        error={error}
        version={version}
        source={source}
      />

      <h1 className="text-2xl font-bold text-gray-900 mb-6">LLM Settings</h1>

      <div className="max-w-lg">
        <TextFieldEditor
          label="Model"
          value={data.model}
          onChange={(v) => setData({ ...data, model: v })}
          description="OpenAI model ID (e.g. gpt-4o-mini, gpt-4o)"
        />

        <NumberFieldEditor
          label="Temperature"
          value={data.temperature}
          onChange={(v) => setData({ ...data, temperature: v })}
          description="Controls randomness (0.0 = deterministic, 2.0 = very random)"
          min={0}
          max={2}
          step={0.1}
        />

        <NumberFieldEditor
          label="Max Output Tokens"
          value={data.maxOutputTokens}
          onChange={(v) => setData({ ...data, maxOutputTokens: v })}
          description="Maximum tokens per LLM response"
          min={256}
          max={16384}
          step={256}
        />
      </div>
    </div>
  );
}
