"use client";

import { useAdminConfig } from "@/components/admin/use-admin-config";
import { SaveBar } from "@/components/admin/save-bar";
import { NumberFieldEditor } from "@/components/admin/editors/number-field-editor";
import type { PhaseConfigData } from "@/lib/admin/config-sections";

const PHASES = ["atmosphere", "breathing", "sensory", "relaxation", "resolution"] as const;

export default function PhaseConfigPage() {
  const { data, setData, loading, saving, error, version, source, save } =
    useAdminConfig<PhaseConfigData>({ section: "phase_config" });

  if (loading || !data) return <p className="text-gray-500">Loading...</p>;

  const updateProportion = (phase: string, value: number) => {
    setData({
      ...data,
      proportions: { ...data.proportions, [phase]: value },
    });
  };

  const total = PHASES.reduce(
    (sum, p) => sum + (data.proportions?.[p] ?? 0),
    0,
  );

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
        Phase Configuration
      </h1>

      <div className="max-w-lg">
        <NumberFieldEditor
          label="Sentences Per Minute"
          value={data.sentencesPerMinute}
          onChange={(v) => setData({ ...data, sentencesPerMinute: v })}
          description="Approximate sentences per minute at natural pacing (~4.5s/sentence)"
          min={5}
          max={30}
        />

        <h2 className="text-lg font-semibold text-gray-800 mt-6 mb-3">
          Phase Proportions
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Must sum to 1.0. Current total:{" "}
          <span
            className={
              Math.abs(total - 1.0) < 0.01
                ? "text-green-600 font-medium"
                : "text-red-600 font-medium"
            }
          >
            {total.toFixed(2)}
          </span>
        </p>

        {PHASES.map((phase) => (
          <NumberFieldEditor
            key={phase}
            label={phase.charAt(0).toUpperCase() + phase.slice(1)}
            value={data.proportions?.[phase] ?? 0}
            onChange={(v) => updateProportion(phase, v)}
            min={0}
            max={1}
            step={0.01}
          />
        ))}
      </div>
    </div>
  );
}
