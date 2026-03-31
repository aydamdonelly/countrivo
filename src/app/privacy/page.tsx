import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy policy for Countrivo, including analytics and Google AdSense advertising disclosures.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
        Privacy Policy
      </h1>
      <p className="mt-4 text-cream-muted leading-relaxed">
        Countrivo is a free geography games and country data website. This page
        explains what limited data may be collected when you use the site and how
        advertising and analytics services may process that data.
      </p>

      <div className="mt-10 space-y-10 text-cream-muted leading-relaxed">
        <section>
          <h2 className="text-2xl font-bold text-cream">Information We Collect</h2>
          <p className="mt-3">
            Countrivo does not require an account to play games or browse country
            pages. We may collect basic usage information such as page views,
            device and browser details, rough location derived from IP address,
            referring pages, and interaction data needed to understand how the
            site is used and improve performance.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-cream">Analytics</h2>
          <p className="mt-3">
            Countrivo uses site analytics tools to understand traffic, popular
            pages, and general product usage. These tools may process technical
            information such as IP address, browser metadata, pages visited, and
            approximate session details.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-cream">
            Advertising and Google AdSense
          </h2>
          <p className="mt-3">
            Countrivo may display ads served by Google AdSense. Google and its
            partners may use cookies or similar technologies to show ads based on
            your visits to this and other websites, measure ad performance, and
            help prevent fraud and abuse.
          </p>
          <p className="mt-3">
            You can learn more about how Google uses information in advertising by
            visiting{" "}
            <a
              href="https://policies.google.com/technologies/ads"
              target="_blank"
              rel="noreferrer"
              className="text-gold hover:underline"
            >
              Google&apos;s advertising policies
            </a>
            . You can also manage ad personalization through{" "}
            <a
              href="https://adssettings.google.com/"
              target="_blank"
              rel="noreferrer"
              className="text-gold hover:underline"
            >
              Google Ads Settings
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-cream">Cookies</h2>
          <p className="mt-3">
            Cookies and local browser storage may be used to keep the site
            functional, remember gameplay preferences, measure traffic, and
            support advertising. Most browsers let you block or delete cookies in
            settings, although some site features may work less reliably if you do
            so.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-cream">Third-Party Links</h2>
          <p className="mt-3">
            Countrivo may link to third-party websites. Their privacy practices
            are governed by their own policies, not this one.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-cream">Policy Updates</h2>
          <p className="mt-3">
            This policy may be updated as the site evolves, including when new
            advertising or analytics features are introduced.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-border text-sm text-cream-muted">
        <Link href="/" className="text-gold hover:underline">
          Return to Countrivo
        </Link>
      </div>
    </div>
  );
}
