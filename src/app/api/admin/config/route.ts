/**
 * GET /api/admin/config
 * List all config sections with version/timestamp.
 */
import { requireAdminApi } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { adminConfig } from "@/lib/db/schema";
import { CONFIG_SECTIONS } from "@/lib/admin/config-sections";

export async function GET() {
  const result = await requireAdminApi();
  if (!result.authorized) return result.response;

  const rows = await db.select().from(adminConfig);

  const sections = CONFIG_SECTIONS.map((section) => {
    const row = rows.find((r) => r.section === section);
    return {
      section,
      version: row?.version ?? 0,
      updatedAt: row?.updatedAt ?? null,
      hasDbConfig: !!row,
    };
  });

  return Response.json({ sections });
}
