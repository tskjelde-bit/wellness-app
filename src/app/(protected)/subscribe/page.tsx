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
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-cream to-blush-light px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-charcoal">
            Unlock Your Wellness Journey
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-charcoal/60">
            Experience personalized, voice-guided relaxation sessions crafted
            just for you. Let yourself be held in a space of calm, presence, and
            gentle awareness.
          </p>
        </div>

        <div className="rounded-[--radius-card] bg-white p-8 shadow-soft">
          <div className="mb-6 text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-rose">
              Full Access
            </p>
            <p className="mt-2 text-2xl font-semibold text-charcoal">
              Monthly Subscription
            </p>
            <p className="mt-1 text-sm text-charcoal/50">
              Unlimited voice-guided sessions
            </p>
          </div>

          <ul className="mb-8 space-y-3 text-sm text-charcoal/70">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-rose">*</span>
              <span>Personalized AI-guided relaxation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-rose">*</span>
              <span>Adaptive sessions that respond to you</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-rose">*</span>
              <span>Safe, private, judgment-free space</span>
            </li>
          </ul>

          <form action={initiateCheckout}>
            <button
              type="submit"
              className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-rose px-4 py-3 font-medium text-white transition-colors hover:bg-rose-dark active:scale-[0.98]"
            >
              Subscribe Now
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-charcoal/40">
            Secure payment processed by CCBill. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
