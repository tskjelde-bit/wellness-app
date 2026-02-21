import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Use process.env directly (not env.ts) to avoid circular dependency
// with Auth.js loading order
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql, schema });
