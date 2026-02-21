import Link from "next/link";

export const dynamic = "force-dynamic";

export default function SubscribeFailurePage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-cream to-blush-light px-4">
      <div className="w-full max-w-md rounded-[--radius-card] bg-white p-8 text-center shadow-soft">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-rose/10">
          <svg
            className="h-6 w-6 text-rose"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-2xl font-semibold text-charcoal">
          Something went wrong with your payment.
        </h1>
        <p className="mb-8 text-charcoal/60">
          No worries -- you were not charged. You can try again whenever you are
          ready.
        </p>

        <div className="space-y-3">
          <Link
            href="/subscribe"
            className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-rose px-4 py-3 font-medium text-white transition-colors hover:bg-rose-dark active:scale-[0.98]"
          >
            Try Again
          </Link>
          <Link
            href="/dashboard"
            className="flex min-h-[44px] w-full items-center justify-center rounded-lg border border-charcoal/20 px-4 py-3 font-medium text-charcoal/60 transition-colors hover:border-charcoal/40 hover:text-charcoal"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
