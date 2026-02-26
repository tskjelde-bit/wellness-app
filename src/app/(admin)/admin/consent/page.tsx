"use client";

import { useAdminConfig } from "@/components/admin/use-admin-config";
import { SaveBar } from "@/components/admin/save-bar";
import { LangTabs } from "@/components/admin/editors/lang-tabs";
import { TextareaEditor } from "@/components/admin/editors/textarea-editor";
import type { ConsentConfig } from "@/lib/admin/config-sections";

export default function ConsentPage() {
  const { data, setData, loading, saving, error, version, source, save } =
    useAdminConfig<ConsentConfig>({ section: "consent" });

  if (loading || !data) return <p className="text-gray-500">Loading...</p>;

  const update = (field: keyof ConsentConfig, lang: string, value: string) => {
    setData({
      ...data,
      [field]: { ...(data[field] as Record<string, string>), [lang]: value },
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
        Consent & Legal
      </h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Terms Text
        </h2>
        <LangTabs>
          {(lang) => (
            <TextareaEditor
              label={`Terms (${lang.toUpperCase()})`}
              value={data.termsText?.[lang] ?? ""}
              onChange={(v) => update("termsText", lang, v)}
              rows={8}
            />
          )}
        </LangTabs>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Medical Disclaimer
        </h2>
        <LangTabs>
          {(lang) => (
            <TextareaEditor
              label={`Disclaimer (${lang.toUpperCase()})`}
              value={data.disclaimerText?.[lang] ?? ""}
              onChange={(v) => update("disclaimerText", lang, v)}
              rows={6}
            />
          )}
        </LangTabs>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Helplines
        </h2>
        <LangTabs>
          {(lang) => (
            <TextareaEditor
              label={`Helplines (${lang.toUpperCase()})`}
              value={data.helplines?.[lang] ?? ""}
              onChange={(v) => update("helplines", lang, v)}
              rows={4}
            />
          )}
        </LangTabs>
      </section>
    </div>
  );
}
