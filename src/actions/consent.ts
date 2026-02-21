"use server";

import { db } from "@/lib/db";
import { usersTable, consentRecordsTable } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { cookies } from "next/headers";
import { getUserConsentStatus } from "@/lib/consent/checks";
import { CONSENT_TYPES, CONSENT_VERSION } from "@/lib/consent/constants";

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

/**
 * Set consent-complete cookie when all required consents are given.
 * This enables optimistic consent checks in proxy.ts without hitting the database.
 */
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

  const now = new Date();

  // Record consent event (immutable audit log)
  await db.insert(consentRecordsTable).values({
    userId: session.user.id,
    consentType: CONSENT_TYPES.AGE_VERIFICATION,
    consentGiven: true,
    consentVersion: CONSENT_VERSION,
    recordedAt: now,
  });

  // Update user record (quick-lookup column)
  await db
    .update(usersTable)
    .set({ ageVerifiedAt: now })
    .where(eq(usersTable.id, session.user.id));

  // DOB is NOT stored -- data minimization per GDPR

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

  // Record two separate consent events (one for ToS, one for privacy)
  await db.insert(consentRecordsTable).values([
    {
      userId: session.user.id,
      consentType: CONSENT_TYPES.TOS_ACCEPTANCE,
      consentGiven: true,
      consentVersion: CONSENT_VERSION,
      recordedAt: now,
    },
    {
      userId: session.user.id,
      consentType: CONSENT_TYPES.PRIVACY_ACCEPTANCE,
      consentGiven: true,
      consentVersion: CONSENT_VERSION,
      recordedAt: now,
    },
  ]);

  // Update user record (quick-lookup columns)
  await db
    .update(usersTable)
    .set({ tosAcceptedAt: now, privacyAcceptedAt: now })
    .where(eq(usersTable.id, session.user.id));

  await setConsentCookieIfComplete(session.user.id);

  return { success: true };
}

export async function recordSensoryConsent(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const consent = formData.get("consent") === "true";

  if (!consent) {
    return { error: "You must provide consent to continue" };
  }

  const now = new Date();

  // Record consent event -- sensory consent is per-session, not permanent
  // (no user column update, only audit log entry)
  await db.insert(consentRecordsTable).values({
    userId: session.user.id,
    consentType: CONSENT_TYPES.SENSORY_CONTENT,
    consentGiven: true,
    consentVersion: CONSENT_VERSION,
    recordedAt: now,
  });

  return { success: true };
}
