import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSubscriptionStatus } from "@/lib/payment";
import { initiateCheckout } from "@/actions/payment";

export const dynamic = "force-dynamic";

export default async function SubscribePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const status = await getSubscriptionStatus(session.user.id);
  if (status === "active") redirect("/dashboard");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-white px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-black text-gray-950 uppercase tracking-tighter leading-none">
            Lås opp din wellness-reise
          </h1>
          <p className="mx-auto mt-6 max-w-sm text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
            Opplev personlig, stemmestyrt avslapning skreddersydd for deg. La deg bli holdt i et rom av ro, tilstedeværelse og nytelse.
          </p>
        </div>

        <div className="rounded-2xl bg-gradient-to-b from-gray-50 to-gray-100 p-8 shadow-heavy border border-gray-200">
          <div className="mb-6 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
              Full tilgang
            </p>
            <p className="mt-3 text-2xl font-black text-gray-950 uppercase tracking-tight">
              Månedlig abonnement
            </p>
            <p className="mt-1 text-xs font-bold text-gray-500 uppercase tracking-widest">
              Ubegrensede sesjoner
            </p>
          </div>

          <ul className="mb-8 space-y-4 text-xs font-bold text-gray-600 uppercase tracking-wider">
            <li className="flex items-start gap-3">
              <span className="shrink-0 text-black">✓</span>
              <span>Personlig AI-veiledet avslapning</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 text-black">✓</span>
              <span>Adaptive sesjoner</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 text-black">✓</span>
              <span>Sikkert, privat rom</span>
            </li>
          </ul>

          <form action={initiateCheckout}>
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-b from-gray-800 to-gray-950 py-4 font-black text-white uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Abonner nå
            </button>
          </form>

          <p className="mt-6 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Sikker betaling via CCBill. Avbryt når som helst.
          </p>
        </div>
      </div>
    </div>
  );
}
