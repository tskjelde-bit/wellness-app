import { db } from "@/lib/db";
import { adminConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const CACHE_TTL_MS = 60_000; // 60 seconds

interface CacheEntry {
  data: Record<string, unknown>;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Get config for a section from DB with 60s in-memory cache.
 * Returns null if no config exists in DB for this section.
 */
export async function getConfig<T = Record<string, unknown>>(
  section: string,
): Promise<T | null> {
  const now = Date.now();
  const cached = cache.get(section);

  if (cached && cached.expiresAt > now) {
    return cached.data as T;
  }

  const [row] = await db
    .select()
    .from(adminConfig)
    .where(eq(adminConfig.section, section))
    .limit(1);

  if (!row) {
    // Cache the miss too so we don't hit DB repeatedly
    cache.set(section, { data: {} as Record<string, unknown>, expiresAt: now + CACHE_TTL_MS });
    return null;
  }

  cache.set(section, { data: row.data, expiresAt: now + CACHE_TTL_MS });
  return row.data as T;
}

/**
 * Invalidate cache for a section (called after admin saves).
 */
export function invalidateConfigCache(section?: string) {
  if (section) {
    cache.delete(section);
  } else {
    cache.clear();
  }
}
