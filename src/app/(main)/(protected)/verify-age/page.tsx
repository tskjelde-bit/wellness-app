import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserConsentStatus } from "@/lib/consent";
import AgeGate from "@/components/consent/age-gate";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Age Verification",
};

export default async function VerifyAgePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const consentStatus = await getUserConsentStatus(session.user.id);

  if (consentStatus.allRequiredConsentsGiven) {
    redirect("/dashboard");
  }

  if (consentStatus.ageVerified) {
    redirect("/accept-terms");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-white px-4">
      <AgeGate />
    </div>
  );
}
