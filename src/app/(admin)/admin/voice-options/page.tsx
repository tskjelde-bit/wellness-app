"use client";

import { useAdminConfig } from "@/components/admin/use-admin-config";
import { SaveBar } from "@/components/admin/save-bar";
import { TextFieldEditor } from "@/components/admin/editors/text-field-editor";
import type { VoiceOptionsConfig } from "@/lib/admin/config-sections";

export default function VoiceOptionsPage() {
  const { data, setData, loading, saving, error, version, source, save } =
    useAdminConfig<VoiceOptionsConfig>({ section: "voice_options" });

  if (loading || !data) return <p className="text-gray-500">Loading...</p>;

  const updateVoice = (
    index: number,
    field: string,
    value: string,
  ) => {
    const voices = [...(data.voices ?? [])];
    voices[index] = { ...voices[index], [field]: value };
    setData({ ...data, voices });
  };

  const addVoice = () => {
    setData({
      ...data,
      voices: [
        ...(data.voices ?? []),
        {
          id: `voice_${Date.now()}`,
          name: "New Voice",
          gender: "female",
          provider: "elevenlabs",
          voiceId: "",
        },
      ],
    });
  };

  const removeVoice = (index: number) => {
    setData({
      ...data,
      voices: (data.voices ?? []).filter((_, i) => i !== index),
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

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Voice Options</h1>
        <button
          onClick={addVoice}
          className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800"
        >
          Add Voice
        </button>
      </div>

      <div className="max-w-lg mb-6">
        <TextFieldEditor
          label="Default Voice ID"
          value={data.defaultVoiceId ?? ""}
          onChange={(v) => setData({ ...data, defaultVoiceId: v })}
          description="The voice ID to use when no preference is set"
        />
      </div>

      {(data.voices ?? []).map((voice, i) => (
        <div
          key={voice.id}
          className="mb-4 rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">
              {voice.name}
            </h2>
            <button
              onClick={() => removeVoice(i)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextFieldEditor
              label="ID"
              value={voice.id}
              onChange={(v) => updateVoice(i, "id", v)}
            />
            <TextFieldEditor
              label="Name"
              value={voice.name}
              onChange={(v) => updateVoice(i, "name", v)}
            />
            <TextFieldEditor
              label="Gender"
              value={voice.gender}
              onChange={(v) => updateVoice(i, "gender", v)}
            />
            <TextFieldEditor
              label="Provider"
              value={voice.provider}
              onChange={(v) => updateVoice(i, "provider", v)}
            />
            <TextFieldEditor
              label="Voice ID"
              value={voice.voiceId}
              onChange={(v) => updateVoice(i, "voiceId", v)}
              description="Provider-specific voice identifier"
            />
          </div>
        </div>
      ))}

      {(!data.voices || data.voices.length === 0) && (
        <p className="text-gray-500 text-sm">
          No voices configured. Click &quot;Add Voice&quot; to add one.
        </p>
      )}
    </div>
  );
}
