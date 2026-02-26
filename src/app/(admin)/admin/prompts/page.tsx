"use client";

import { useAdminConfig } from "@/components/admin/use-admin-config";
import { SaveBar } from "@/components/admin/save-bar";
import { LangTabs } from "@/components/admin/editors/lang-tabs";
import { TextareaEditor } from "@/components/admin/editors/textarea-editor";
import type { PromptsConfig } from "@/lib/admin/config-sections";

export default function PromptsPage() {
  const { data, setData, loading, saving, error, version, source, save } =
    useAdminConfig<PromptsConfig>({ section: "prompts" });

  if (loading || !data) return <p className="text-gray-500">Loading...</p>;

  const updateSystemBase = (lang: string, value: string) => {
    setData({
      ...data,
      systemBase: { ...data.systemBase, [lang]: value },
    });
  };

  const updateJailbreak = (lang: string, value: string) => {
    setData({
      ...data,
      jailbreak: { ...data.jailbreak, [lang]: value },
    });
  };

  const updateCharacter = (char: string, lang: string, value: string) => {
    setData({
      ...data,
      characters: {
        ...data.characters,
        [char]: { ...(data.characters[char] as Record<string, string>), [lang]: value },
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

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        System Prompts & Characters
      </h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          System Base Prompt
        </h2>
        <LangTabs>
          {(lang) => (
            <TextareaEditor
              label={`System base (${lang.toUpperCase()})`}
              value={data.systemBase?.[lang] ?? ""}
              onChange={(v) => updateSystemBase(lang, v)}
              rows={8}
            />
          )}
        </LangTabs>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Jailbreak Prompt
        </h2>
        <LangTabs>
          {(lang) => (
            <TextareaEditor
              label={`Jailbreak (${lang.toUpperCase()})`}
              value={data.jailbreak?.[lang] ?? ""}
              onChange={(v) => updateJailbreak(lang, v)}
              rows={4}
            />
          )}
        </LangTabs>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Character Prompts
        </h2>
        {Object.keys(data.characters ?? {}).map((char) => (
          <div key={char} className="mb-6 rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-700 mb-3">{char}</h3>
            <LangTabs>
              {(lang) => (
                <TextareaEditor
                  label={`${char} (${lang.toUpperCase()})`}
                  value={(data.characters[char] as Record<string, string>)?.[lang] ?? ""}
                  onChange={(v) => updateCharacter(char, lang, v)}
                  rows={4}
                />
              )}
            </LangTabs>
          </div>
        ))}
      </section>
    </div>
  );
}
