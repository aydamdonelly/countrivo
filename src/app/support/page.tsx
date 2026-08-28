import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with Countrivo, contact, FAQ, and how to manage your account.",
};

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-cream">{q}</h2>
      <p className="mt-2 text-cream-muted leading-relaxed">{children}</p>
    </section>
  );
}

export default function SupportPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Support</h1>
      <p className="mt-4 text-cream-muted leading-relaxed">
        Need help? Email{" "}
        <a href="mailto:countrivo@gmail.com" className="text-cream font-medium underline underline-offset-4">
          countrivo@gmail.com
        </a>{" "}
        and we&apos;ll get back to you.
      </p>

      <div className="mt-10 space-y-8">
        <Faq q="When does the daily reset?">
          Every day at midnight Europe/Berlin time. One puzzle per game, the same for every player
          worldwide. Extra appetite? Practice mode is unlimited.
        </Faq>
        <Faq q="How do I delete my account?">
          Open your profile and use “Delete account” in the danger zone. Deletion is immediate and
          permanent and removes all your data.
        </Faq>
        <Faq q="How do I turn off notifications?">
          Turn them off in your device Settings → Countrivo → Notifications. We only send a daily
          streak reminder and challenge alerts.
        </Faq>
        <Faq q="How do I report a player?">
          Email us the username and what happened. We review every report, rename or remove
          abusive accounts, and you can remove anyone from your friends list at any time.
        </Faq>
        <Faq q="I lost my streak / a score didn’t save">
          Scores save automatically when you finish; if you were offline, they sync when you
          reconnect. If something looks wrong, email us with the date and game.
        </Faq>
      </div>

      <div className="mt-12 pt-8 border-t border-border text-sm text-cream-muted flex gap-4">
        <Link href="/privacy" className="text-cream underline underline-offset-4">Privacy</Link>
        <Link href="/terms" className="text-cream underline underline-offset-4">Terms</Link>
        <Link href="/" className="text-cream underline underline-offset-4">Home</Link>
      </div>
    </div>
  );
}
