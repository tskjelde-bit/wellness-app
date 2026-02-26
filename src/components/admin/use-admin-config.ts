"use client";

import { useState, useEffect, useCallback } from "react";

interface UseAdminConfigOptions<T> {
  section: string;
}

export function useAdminConfig<T>({
  section,
}: UseAdminConfigOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [source, setSource] = useState<"database" | "defaults">("defaults");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/config/${section}`);
      if (!res.ok) throw new Error("Failed to load config");
      const json = await res.json();
      setData(json.data as T);
      setVersion(json.version);
      setSource(json.source);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (newData: T) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/config/${section}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: newData }),
      });
      if (!res.ok) throw new Error("Failed to save config");
      const json = await res.json();
      setData(json.data as T);
      setVersion(json.version);
      setSource("database");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return { data, setData, loading, saving, error, version, source, save, reload: load };
}
