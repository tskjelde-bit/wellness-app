import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Use process.env directly (not env.ts) to avoid circular dependency
// with Auth.js loading order.
// Provide a placeholder URL when DATABASE_URL is not set so the module
// can be imported at build time without crashing. Actual queries will
// fail with a clear connection error if DATABASE_URL is truly missing.
const sql = neon(process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost/placeholder");
export const db = drizzle({ client: sql, schema });
