import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface ConsentStatus {
  ageVerified: boolean;
  tosAccepted: boolean;
  privacyAccepted: boolean;
  allRequiredConsentsGiven: boolean;
}

export async function getUserConsentStatus(
  userId: string
): Promise<ConsentStatus> {
  const [user] = await db
    .select({
      isAdultVerified: users.isAdultVerified,
      hasAcceptedTerms: users.hasAcceptedTerms,
      hasAcceptedMedicalDisclaimer: users.hasAcceptedMedicalDisclaimer,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return {
      ageVerified: false,
      tosAccepted: false,
      privacyAccepted: false,
      allRequiredConsentsGiven: false,
    };
  }

  const ageVerified = user.isAdultVerified;
  const tosAccepted = user.hasAcceptedTerms;
  const privacyAccepted = user.hasAcceptedMedicalDisclaimer; // Using disclaimer as proxy for privacy in this simplified check

  return {
    ageVerified,
    tosAccepted,
    privacyAccepted,
    allRequiredConsentsGiven: ageVerified && tosAccepted && privacyAccepted,
  };
}
