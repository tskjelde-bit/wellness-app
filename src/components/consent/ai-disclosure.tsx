import { AI_DISCLOSURE_TEXT } from "@/lib/consent/constants";

export function AIDisclosure() {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-lg bg-cream p-5 text-charcoal"
    >
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-charcoal/70">
        AI Disclosure
      </h3>
      <p className="text-sm leading-relaxed">{AI_DISCLOSURE_TEXT}</p>
    </div>
  );
}
