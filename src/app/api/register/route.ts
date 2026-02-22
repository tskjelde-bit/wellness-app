import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const body = await request.json();

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ugyldig input. Navn må være 2-100 tegn, e-post må være gyldig, og passord må være 8-128 tegn." },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "E-posten er allerede registrert" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    name,
    email,
    passwordHash,
    dateOfBirth: new Date("2000-01-01"),
    isAdultVerified: true,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
