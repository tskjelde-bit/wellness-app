/**
 * Set isAdmin = true for a specific user email.
 *
 * Usage: npx tsx scripts/seed-admin.ts user@example.com
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx tsx scripts/seed-admin.ts <email>");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function main() {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  await db
    .update(schema.users)
    .set({ isAdmin: true })
    .where(eq(schema.users.id, user.id));

  console.log(`Admin access granted to: ${email} (id: ${user.id})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
