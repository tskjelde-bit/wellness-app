"use server";

import { db } from "@/lib/db";
import { usersTable } from "@/lib/db/schema";
import { signIn, signOut } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function signUp(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Invalid input. Name must be 2-100 characters, email must be valid, and password must be 8-128 characters." };
  }

  const { name, email, password } = parsed.data;

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (existing) {
    return { error: "Email already registered" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(usersTable).values({
    name,
    email,
    passwordHash,
  });

  return { success: true };
}

export async function signInAction(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid credentials" };
    }
    // Auth.js throws a NEXT_REDIRECT on success -- re-throw it
    throw error;
  }

  return null;
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
