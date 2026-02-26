"use client";

interface TextareaEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  placeholder?: string;
  rows?: number;
}

export function TextareaEditor({
  label,
  value,
  onChange,
  description,
  placeholder,
  rows = 6,
}: TextareaEditorProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {description && (
        <p className="text-xs text-gray-500 mb-1">{description}</p>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 resize-y"
      />
    </div>
  );
}
