import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <article className="mx-auto max-w-2xl text-charcoal">
        <h1 className="mb-2 text-3xl font-semibold">Privacy Policy</h1>
        <p className="mb-8 text-sm text-charcoal/50">
          Version 1.0 &mdash; Last updated: February 21, 2026
        </p>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">
            Information We Collect
          </h2>
          <p className="mb-2 leading-relaxed">
            When you create an account and use our service, we collect the
            following information:
          </p>
          <ul className="ml-6 list-disc space-y-1 leading-relaxed">
            <li>Email address (for account authentication)</li>
            <li>Password hash (securely hashed, never stored in plain text)</li>
            <li>Consent records (timestamps of when you accepted terms)</li>
            <li>
              Session timing metadata (session start and end times for service
              improvement)
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">
            Information We Do NOT Collect
          </h2>
          <p className="mb-2 leading-relaxed">
            Your privacy is paramount. We intentionally do not collect or store:
          </p>
          <ul className="ml-6 list-disc space-y-1 leading-relaxed">
            <li>Session transcripts or conversation content</li>
            <li>Audio recordings</li>
            <li>Conversation history</li>
            <li>
              Date of birth (used only for age verification, then immediately
              discarded)
            </li>
          </ul>
          <p className="mt-2 leading-relaxed">
            All session content is ephemeral by design. Once your session ends,
            the content is gone.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">
            How We Use Your Information
          </h2>
          <ul className="ml-6 list-disc space-y-1 leading-relaxed">
            <li>Account management and authentication</li>
            <li>Consent verification and compliance</li>
            <li>
              Service improvement through anonymous, aggregated metrics only
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Data Retention</h2>
          <ul className="ml-6 list-disc space-y-1 leading-relaxed">
            <li>
              <strong>Account data:</strong> Retained until you request account
              deletion
            </li>
            <li>
              <strong>Consent records:</strong> Maintained as a permanent audit
              trail for legal compliance
            </li>
            <li>
              <strong>Session content:</strong> Never stored. Sessions are
              ephemeral by design.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Third-Party Services</h2>
          <p className="leading-relaxed">
            We use OpenAI for content moderation and AI-generated guidance. By
            design, no user content is stored by third-party services. Content is
            processed in real-time and not retained.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Your Rights</h2>
          <p className="mb-2 leading-relaxed">You have the right to:</p>
          <ul className="ml-6 list-disc space-y-1 leading-relaxed">
            <li>Access your personal data</li>
            <li>Request deletion of your account and associated data</li>
            <li>Data portability (export your account information)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Contact</h2>
          <p className="leading-relaxed">
            For privacy-related inquiries, please contact us at{" "}
            <a
              href="mailto:privacy@example.com"
              className="font-medium text-rose hover:text-rose/80 underline"
            >
              privacy@example.com
            </a>
            .
          </p>
        </section>

        <div className="mt-12 rounded-lg bg-cream p-4 text-sm text-charcoal/60">
          <p>
            <strong>Note:</strong> This privacy policy is a placeholder for
            legal review. Please consult with a legal professional before public
            launch.
          </p>
        </div>
      </article>
    </div>
  );
}
