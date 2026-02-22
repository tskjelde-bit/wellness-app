import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signOutAction } from "@/actions/auth";
import { getUserConsentStatus } from "@/lib/consent";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Skip consent checks in development for easier testing
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

  return (
    <div className="flex min-h-dvh items-center justify-center bg-white px-4">
      <div className="w-full max-w-md rounded-[--radius-card] bg-gradient-to-b from-gray-50 to-gray-100 p-8 shadow-heavy border border-gray-200">
        <h1 className="mb-2 text-center text-3xl font-black text-gray-950 uppercase tracking-tighter">
          Dashboard
        </h1>
        <p className="mb-8 text-center text-sm font-bold text-gray-500 uppercase tracking-widest">
          Velkommen, {session.user?.name || session.user?.email}
        </p>

        <div className="space-y-4">
          <Link
            href="/session"
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-gradient-to-b from-gray-800 to-gray-950 px-4 py-4 font-black text-white uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Start ny sesjon
          </Link>

          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full rounded-xl border-2 border-gray-950 bg-transparent px-4 py-3 font-bold text-gray-950 uppercase text-xs tracking-widest transition-all hover:bg-gray-200 active:scale-[0.98]"
            >
              Logg ut
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
