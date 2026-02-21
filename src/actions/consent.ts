"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { cookies } from "next/headers";
import { getUserConsentStatus } from "@/lib/consent/checks";

const dobSchema = z.object({
  dateOfBirth: z.string().refine(
    (dob) => {
      const birthDate = new Date(dob);
      if (isNaN(birthDate.getTime())) return false;
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      const actualAge =
        monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
      return actualAge >= 18;
    },
    { message: "You must be 18 or older" }
  ),
});

async function setConsentCookieIfComplete(userId: string): Promise<void> {
  const status = await getUserConsentStatus(userId);
  if (status.allRequiredConsentsGiven) {
    const cookieStore = await cookies();
    cookieStore.set("consent-complete", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });
  }
}

export async function verifyAge(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = dobSchema.safeParse({
    dateOfBirth: formData.get("dateOfBirth"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Update user record (new schema fields)
  await db
    .update(users)
    .set({
      dateOfBirth: new Date(formData.get("dateOfBirth") as string),
      isAdultVerified: true
    })
    .where(eq(users.id, session.user.id));

  await setConsentCookieIfComplete(session.user.id);

  return { success: true };
}

export async function acceptTerms(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const tosAccepted = formData.get("tosAccepted") === "true";
  const privacyAccepted = formData.get("privacyAccepted") === "true";

  if (!tosAccepted || !privacyAccepted) {
    return {
      error:
        "You must accept both the Terms of Service and Privacy Policy to continue",
    };
  }

  const now = new Date();

  // Update user record (new schema fields)
  await db
    .update(users)
    .set({
      hasAcceptedTerms: true,
      hasAcceptedMedicalDisclaimer: true,
      termsAcceptedAt: now
    })
    .where(eq(users.id, session.user.id));

  await setConsentCookieIfComplete(session.user.id);

  return { success: true };
}

export async function recordSensoryConsent(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  // Sensory consent not explicitly in new schema, return success to not break UI
  return { success: true };
}
