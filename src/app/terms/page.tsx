import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Countrivo, the rules for using the free geography game.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-cream">{title}</h2>
      <p className="mt-3">{children}</p>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Terms of Service</h1>
      <p className="mt-4 text-cream-muted leading-relaxed">
        Welcome to Countrivo, a free daily geography game. By playing or creating an account you
        agree to these terms. Play fair and be kind.
      </p>

      <div className="mt-10 space-y-10 text-cream-muted leading-relaxed">
        <Section title="Eligibility">
          You must be at least 13 years old to create an account. Anyone may play without one.
        </Section>
        <Section title="Your account & username">
          You are responsible for activity on your account. Usernames and display names must not
          impersonate others or contain hateful, harassing, or obscene content. We may rename,
          suspend, or remove accounts that break these rules. You can delete your account and all
          its data at any time from your profile.
        </Section>
        <Section title="Acceptable use">
          Don&apos;t cheat (e.g. submitting fabricated scores), abuse other players, scrape or
          attack the service, or attempt to disrupt the daily challenge for others.
        </Section>
        <Section title="Friends & reporting">
          The social features let you add friends and compare scores. You can block and report
          other players; we may act on reports at our discretion.
        </Section>
        <Section title="Service provided “as is”">
          Countrivo is provided free, without warranties, and may change or be unavailable at any
          time. We are not liable for any loss arising from use of the game to the extent permitted
          by law.
        </Section>
        <Section title="Changes & termination">
          We may update these terms or the game as it evolves. You may stop using Countrivo and
          delete your account anytime; we may suspend accounts that violate these terms.
        </Section>
        <Section title="Contact">
          Questions? Email{" "}
          <a href="mailto:countrivo@gmail.com" className="text-gold-ink hover:underline">
            countrivo@gmail.com
          </a>
          . See also our{" "}
          <Link href="/privacy" className="text-gold-ink hover:underline">Privacy Policy</Link>.
        </Section>
      </div>

      <div className="mt-12 pt-8 border-t border-border text-sm text-cream-muted">
        <Link href="/" className="text-gold-ink hover:underline">Return to Countrivo</Link>
      </div>
    </div>
  );
}
