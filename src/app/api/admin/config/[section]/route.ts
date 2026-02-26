/**
 * GET  /api/admin/config/[section] — return config data (DB or file defaults)
 * PUT  /api/admin/config/[section] — upsert config, bump version, invalidate cache
 */
import { requireAdminApi } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { adminConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isValidSection, getDefaultConfigForSection } from "@/lib/admin/config-sections";
import { invalidateConfigCache } from "@/lib/admin/config-loader";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ section: string }> },
) {
  const result = await requireAdminApi();
  if (!result.authorized) return result.response;

  const { section } = await params;

  if (!isValidSection(section)) {
    return Response.json({ error: "Invalid section" }, { status: 400 });
  }

  const [row] = await db
    .select()
    .from(adminConfig)
    .where(eq(adminConfig.section, section))
    .limit(1);

  if (row) {
    return Response.json({
      section,
      data: row.data,
      version: row.version,
      updatedAt: row.updatedAt,
      source: "database",
    });
  }

  // Return file-based defaults
  const defaults = await getDefaultConfigForSection(section);
  return Response.json({
    section,
    data: defaults,
    version: 0,
    updatedAt: null,
    source: "defaults",
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ section: string }> },
) {
  const result = await requireAdminApi();
  if (!result.authorized) return result.response;

  const { section } = await params;

  if (!isValidSection(section)) {
    return Response.json({ error: "Invalid section" }, { status: 400 });
  }

  const body = await request.json();
  const { data } = body;

  if (!data || typeof data !== "object") {
    return Response.json({ error: "Missing or invalid data" }, { status: 400 });
  }

  const userId = result.session?.user?.id;

  // Check if row exists
  const [existing] = await db
    .select()
    .from(adminConfig)
    .where(eq(adminConfig.section, section))
    .limit(1);

  if (existing) {
    await db
      .update(adminConfig)
      .set({
        data,
        version: existing.version + 1,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(adminConfig.section, section));
  } else {
    await db.insert(adminConfig).values({
      section,
      data,
      version: 1,
      updatedBy: userId,
    });
  }

  invalidateConfigCache(section);

  const [updated] = await db
    .select()
    .from(adminConfig)
    .where(eq(adminConfig.section, section))
    .limit(1);

  return Response.json({
    section,
    data: updated.data,
    version: updated.version,
    updatedAt: updated.updatedAt,
    source: "database",
  });
}
