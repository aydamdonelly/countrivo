import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy policy for Countrivo, covering analytics and optional account data.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
        Privacy Policy
      </h1>
      <p className="mt-4 text-cream-muted leading-relaxed">
        Countrivo is a free geography games and country data website. This page
        explains what limited data may be collected when you use the site, how
        analytics services may process it, and what optional account data is stored.
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
            Countrivo uses Vercel Web Analytics, and Vercel Speed Insights for
            performance, to understand traffic, popular pages, and general
            product usage. These privacy-friendly tools process technical
            information such as IP address, browser metadata, and pages visited.
            They do not track you across other apps or websites, and Countrivo
            runs no advertising trackers.
          </p>
          <p className="mt-3">
            Account data (email, username, scores, streaks, friends, and any iOS
            notification token) is stored and processed by Supabase, our backend
            and database provider, acting as our data processor.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-cream">Accounts</h2>
          <p className="mt-3">
            Playing is free and needs no account. If you choose to create one, we
            store your email address and a username so we can save your scores,
            streaks, and friends. You can delete your account and all associated
            data at any time from your profile, deletion is immediate and
            permanent. Countrivo shows no ads and does not sell your data.
          </p>
          <p className="mt-3">
            You can sign in with your Apple ID. In the iOS app, if you allow
            notifications we store a device token so we can send daily-streak
            reminders and challenge alerts; the token is removed when you turn
            notifications off or delete your account.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-cream">Cookies</h2>
          <p className="mt-3">
            Cookies and local browser storage may be used to keep the site
            functional, remember gameplay preferences, and measure traffic.
            Most browsers let you block or delete cookies in
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
            features or analytics tools are introduced.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-border text-sm text-cream-muted">
        <Link href="/" className="text-cream underline underline-offset-4">
          Return to Countrivo
        </Link>
      </div>
    </div>
  );
}
