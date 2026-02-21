import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signOutAction } from "@/actions/auth";
import { getUserConsentStatus } from "@/lib/consent";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const consentStatus = await getUserConsentStatus(session.user.id);
  if (!consentStatus.allRequiredConsentsGiven) {
    if (!consentStatus.ageVerified) {
      redirect("/verify-age");
    } else if (!consentStatus.tosAccepted || !consentStatus.privacyAccepted) {
      redirect("/accept-terms");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-semibold text-charcoal">
          Dashboard
        </h1>
        <p className="mb-8 text-center text-charcoal/60">
          Welcome, {session.user?.name || session.user?.email}
        </p>

        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full rounded-lg bg-rose px-4 py-2.5 font-medium text-white transition-colors hover:bg-rose/90"
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
