import { HELPLINE_RESOURCES } from "@/lib/consent/constants";

export function CrisisBanner() {
  return (
    <div className="rounded-lg bg-cream p-5 text-charcoal">
      <h3 className="mb-3 text-base font-semibold">Support Resources</h3>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium">
            {HELPLINE_RESOURCES.crisis.name}
          </p>
          <p className="mt-1 text-sm text-charcoal/70">
            Call or text{" "}
            <a
              href="tel:988"
              className="font-medium text-rose hover:text-rose/80 underline"
            >
              {HELPLINE_RESOURCES.crisis.phone}
            </a>{" "}
            &middot; {HELPLINE_RESOURCES.crisis.text}
          </p>
          <a
            href={HELPLINE_RESOURCES.crisis.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-sm text-rose hover:text-rose/80 underline"
          >
            988lifeline.org
          </a>
        </div>

        <div>
          <p className="text-sm font-medium">
            {HELPLINE_RESOURCES.samhsa.name}
          </p>
          <p className="mt-1 text-sm text-charcoal/70">
            Call{" "}
            <a
              href="tel:1-800-662-4357"
              className="font-medium text-rose hover:text-rose/80 underline"
            >
              {HELPLINE_RESOURCES.samhsa.phone}
            </a>
          </p>
          <a
            href={HELPLINE_RESOURCES.samhsa.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-sm text-rose hover:text-rose/80 underline"
          >
            samhsa.gov
          </a>
        </div>
      </div>

      <p className="mt-4 text-xs text-charcoal/50">
        These services are free, confidential, and available 24/7.
      </p>
    </div>
  );
}
