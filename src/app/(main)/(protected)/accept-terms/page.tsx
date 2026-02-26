import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserConsentStatus } from "@/lib/consent";
import TosAcceptance from "@/components/consent/tos-acceptance";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Accept Terms & Privacy",
};

export default async function AcceptTermsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const consentStatus = await getUserConsentStatus(session.user.id);

  if (!consentStatus.ageVerified) {
    redirect("/verify-age");
  }

  if (consentStatus.tosAccepted && consentStatus.privacyAccepted) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-white px-4">
      <TosAcceptance />
    </div>
  );
}
