"use client";

import { useState } from "react";
import { useAdminConfig } from "@/components/admin/use-admin-config";
import { SaveBar } from "@/components/admin/save-bar";
import { LangTabs } from "@/components/admin/editors/lang-tabs";
import { TextFieldEditor } from "@/components/admin/editors/text-field-editor";
import type { TranslationsConfig } from "@/lib/admin/config-sections";

export default function TranslationsPage() {
  const { data, setData, loading, saving, error, version, source, save } =
    useAdminConfig<TranslationsConfig>({ section: "translations" });
  const [newKey, setNewKey] = useState("");

  if (loading || !data) return <p className="text-gray-500">Loading...</p>;

  const keys = Object.keys(data);

  const updateTranslation = (key: string, lang: string, value: string) => {
    setData({
      ...data,
      [key]: { ...(data[key] as Record<string, string>), [lang]: value },
    });
  };

  const addKey = () => {
    const k = newKey.trim();
    if (k && !data[k]) {
      setData({ ...data, [k]: { no: "", en: "", sv: "" } });
      setNewKey("");
    }
  };

  const removeKey = (key: string) => {
    const next = { ...data };
    delete next[key];
    setData(next);
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
        UI Translations
      </h1>

      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="app.new_key"
          className="flex-1 max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          onKeyDown={(e) => e.key === "Enter" && addKey()}
        />
        <button
          onClick={addKey}
          className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800"
        >
          Add Key
        </button>
      </div>

      {keys.map((key) => (
        <div
          key={key}
          className="mb-4 rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <code className="text-sm font-mono text-gray-600">{key}</code>
            <button
              onClick={() => removeKey(key)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
          <LangTabs>
            {(lang) => (
              <TextFieldEditor
                label={lang.toUpperCase()}
                value={(data[key] as Record<string, string>)?.[lang] ?? ""}
                onChange={(v) => updateTranslation(key, lang, v)}
              />
            )}
          </LangTabs>
        </div>
      ))}
    </div>
  );
}
