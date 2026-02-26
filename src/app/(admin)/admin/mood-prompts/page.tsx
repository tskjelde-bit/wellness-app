"use client";

import { useAdminConfig } from "@/components/admin/use-admin-config";
import { SaveBar } from "@/components/admin/save-bar";
import { LangTabs } from "@/components/admin/editors/lang-tabs";
import { TextareaEditor } from "@/components/admin/editors/textarea-editor";
import { TextFieldEditor } from "@/components/admin/editors/text-field-editor";
import type { MoodPromptsConfig } from "@/lib/admin/config-sections";

export default function MoodPromptsPage() {
  const { data, setData, loading, saving, error, version, source, save } =
    useAdminConfig<MoodPromptsConfig>({ section: "mood_prompts" });

  if (loading || !data) return <p className="text-gray-500">Loading...</p>;

  const updateOption = (index: number, field: string, value: string) => {
    const options = [...(data.options ?? [])];
    options[index] = { ...options[index], [field]: value };
    setData({ ...data, options });
  };

  const updateMoodPrompt = (lang: string, moodId: string, value: string) => {
    setData({
      ...data,
      prompts: {
        ...data.prompts,
        [lang]: { ...(data.prompts?.[lang as keyof typeof data.prompts] ?? {}), [moodId]: value },
      },
    });
  };

  const addMood = () => {
    const id = `mood_${Date.now()}`;
    setData({
      ...data,
      options: [...(data.options ?? []), { id, label: "New Mood", emoji: "" }],
      prompts: {
        no: { ...(data.prompts?.no ?? {}), [id]: "" },
        en: { ...(data.prompts?.en ?? {}), [id]: "" },
        sv: { ...(data.prompts?.sv ?? {}), [id]: "" },
      },
    });
  };

  const removeMood = (index: number) => {
    const moodId = data.options[index].id;
    const options = data.options.filter((_, i) => i !== index);
    const prompts = { ...data.prompts };
    for (const lang of ["no", "en", "sv"] as const) {
      if (prompts[lang]) {
        const langPrompts = { ...prompts[lang] };
        delete langPrompts[moodId];
        prompts[lang] = langPrompts;
      }
    }
    setData({ ...data, options, prompts });
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

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mood Prompts</h1>
        <button
          onClick={addMood}
          className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800"
        >
          Add Mood
        </button>
      </div>

      {(data.options ?? []).map((opt, i) => (
        <section
          key={opt.id}
          className="mb-6 rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">{opt.label}</h2>
            <button
              onClick={() => removeMood(i)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <TextFieldEditor
              label="ID"
              value={opt.id}
              onChange={(v) => updateOption(i, "id", v)}
            />
            <TextFieldEditor
              label="Label"
              value={opt.label}
              onChange={(v) => updateOption(i, "label", v)}
            />
            <TextFieldEditor
              label="Emoji"
              value={opt.emoji}
              onChange={(v) => updateOption(i, "emoji", v)}
            />
          </div>

          <LangTabs>
            {(lang) => (
              <TextareaEditor
                label={`Mood prompt (${lang.toUpperCase()})`}
                value={
                  (data.prompts?.[lang as keyof typeof data.prompts] as Record<string, string>)?.[opt.id] ?? ""
                }
                onChange={(v) => updateMoodPrompt(lang, opt.id, v)}
                rows={4}
              />
            )}
          </LangTabs>
        </section>
      ))}
    </div>
  );
}
