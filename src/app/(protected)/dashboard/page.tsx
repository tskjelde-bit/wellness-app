import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signOutAction } from "@/actions/auth";
import { getUserConsentStatus } from "@/lib/consent";
import Link from "next/link";

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
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-cream to-blush-light px-4">
      <div className="w-full max-w-md rounded-[--radius-card] bg-white p-8 shadow-soft">
        <h1 className="mb-2 text-center text-2xl font-semibold text-charcoal">
          Dashboard
        </h1>
        <p className="mb-8 text-center text-charcoal/60">
          Welcome, {session.user?.name || session.user?.email}
        </p>

        <div className="space-y-4">
          <Link
            href="/session"
            className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-rose px-4 py-3 font-medium text-white transition-colors hover:bg-rose-dark active:scale-[0.98]"
          >
            Start New Session
          </Link>

          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full rounded-lg border border-charcoal/20 bg-transparent px-4 py-2.5 font-medium text-charcoal/60 transition-colors hover:border-charcoal/40 hover:text-charcoal"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
