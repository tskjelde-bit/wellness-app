import { db } from "@/lib/db";
import { usersTable } from "@/lib/db/schema";
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
      ageVerifiedAt: usersTable.ageVerifiedAt,
      tosAcceptedAt: usersTable.tosAcceptedAt,
      privacyAcceptedAt: usersTable.privacyAcceptedAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    return {
      ageVerified: false,
      tosAccepted: false,
      privacyAccepted: false,
      allRequiredConsentsGiven: false,
    };
  }

  const ageVerified = user.ageVerifiedAt !== null;
  const tosAccepted = user.tosAcceptedAt !== null;
  const privacyAccepted = user.privacyAcceptedAt !== null;

  return {
    ageVerified,
    tosAccepted,
    privacyAccepted,
    allRequiredConsentsGiven: ageVerified && tosAccepted && privacyAccepted,
  };
}
