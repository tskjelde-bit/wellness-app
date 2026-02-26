import { HELPLINE_RESOURCES } from "@/lib/consent/constants";

export function CrisisBanner() {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-gray-900">
      <h3 className="mb-3 text-[11px] font-black text-gray-800 uppercase tracking-[0.15em]">
        Support Resources
      </h3>

      <div className="space-y-3">
        <div>
          <p className="text-[10px] font-black text-gray-800">
            {HELPLINE_RESOURCES.crisis.name}
          </p>
          <p className="mt-1 text-[10px] font-bold text-gray-500">
            Call or text{" "}
            <a
              href="tel:988"
              className="font-black text-gray-900 underline underline-offset-4 decoration-gray-300"
            >
              {HELPLINE_RESOURCES.crisis.phone}
            </a>{" "}
            &middot; {HELPLINE_RESOURCES.crisis.text}
          </p>
          <a
            href={HELPLINE_RESOURCES.crisis.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-[10px] font-black text-gray-900 underline underline-offset-4 decoration-gray-300"
          >
            988lifeline.org
          </a>
        </div>

        <div>
          <p className="text-[10px] font-black text-gray-800">
            {HELPLINE_RESOURCES.samhsa.name}
          </p>
          <p className="mt-1 text-[10px] font-bold text-gray-500">
            Call{" "}
            <a
              href="tel:1-800-662-4357"
              className="font-black text-gray-900 underline underline-offset-4 decoration-gray-300"
            >
              {HELPLINE_RESOURCES.samhsa.phone}
            </a>
          </p>
          <a
            href={HELPLINE_RESOURCES.samhsa.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-[10px] font-black text-gray-900 underline underline-offset-4 decoration-gray-300"
          >
            samhsa.gov
          </a>
        </div>
      </div>

      <p className="mt-3 text-[9px] font-bold text-gray-400">
        These services are free, confidential, and available 24/7.
      </p>
    </div>
  );
}
