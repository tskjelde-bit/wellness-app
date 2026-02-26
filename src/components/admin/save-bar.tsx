"use client";

interface SaveBarProps {
  onSave: () => void;
  saving: boolean;
  error: string | null;
  version: number;
  source: "database" | "defaults";
}

export function SaveBar({ onSave, saving, error, version, source }: SaveBarProps) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3 -mx-6 -mt-6 mb-6 lg:-mx-8 lg:-mt-8 lg:px-8">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span>v{version}</span>
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${
          source === "database"
            ? "bg-green-100 text-green-700"
            : "bg-yellow-100 text-yellow-700"
        }`}>
          {source === "database" ? "From DB" : "Defaults"}
        </span>
        {error && <span className="text-red-600">{error}</span>}
      </div>
      <button
        onClick={onSave}
        disabled={saving}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
