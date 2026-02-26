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
    <div className="flex flex-1 items-center justify-center bg-white px-4">
      <div className="w-full rounded-xl bg-gradient-to-b from-gray-50 to-gray-100 p-6 shadow-soft border border-gray-200">
        <h1 className="mb-2 text-center text-[13px] font-black text-gray-900 uppercase tracking-[0.25em]">
          Dashboard
        </h1>
        <p className="mb-6 text-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em]">
          Velkommen, {session.user?.name || session.user?.email}
        </p>

        <div className="space-y-3">
          <Link
            href="/session"
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-gradient-to-b from-gray-800 to-gray-950 px-6 py-3 text-[12px] font-black text-white uppercase tracking-[0.15em] transition-all hover:opacity-90 active:scale-[0.97]"
          >
            Start ny sesjon
          </Link>

          {session.user.isAdmin && (
            <Link
              href="/admin"
              className="flex min-h-[44px] w-full items-center justify-center rounded-xl border-2 border-gray-800 px-6 py-3 text-[12px] font-black text-gray-800 uppercase tracking-[0.15em] transition-all hover:bg-gray-800 hover:text-white active:scale-[0.97]"
            >
              Admin Panel
            </Link>
          )}

          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full rounded-xl border-2 border-gray-200 px-6 py-3 text-[12px] font-bold text-gray-500 uppercase tracking-[0.15em] transition-all hover:border-gray-300 hover:text-gray-700 active:scale-[0.97]"
            >
              Logg ut
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
