import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserConsentStatus } from "@/lib/consent";
import { SessionScreen } from "@/components/session/session-screen";

export const dynamic = "force-dynamic";

export default async function SessionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Consent checks (skipped in development for easier testing)
  if (process.env.NODE_ENV !== "development") {
    const consentStatus = await getUserConsentStatus(session.user.id);
    if (!consentStatus.allRequiredConsentsGiven) {
      if (!consentStatus.ageVerified) {
        redirect("/verify-age");
      } else if (!consentStatus.tosAccepted || !consentStatus.privacyAccepted) {
        redirect("/accept-terms");
      }
    }
  }

  return <SessionScreen />;
}
