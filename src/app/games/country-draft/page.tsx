import Link from "next/link";
import type { Metadata } from "next";
import { GameJsonLd } from "@/components/seo/game-jsonld";
import { getGameColor } from "@/lib/game-colors";
import { PlayedTodayBanner } from "@/components/game/played-today-banner";

export const metadata: Metadata = {
  title: "Country Draft | Assign Countries to Their Best Stats",
  description:
    "8 countries. 8 stat categories. Assign each country to where it ranks highest globally. Beat the optimal score. Free flagship geography game.",
  alternates: { canonical: "https://countrivo.com/games/country-draft" },
};

export default function CountryDraftPage() {
  return (
    <>
      <GameJsonLd
        name="Country Draft | Countrivo"
        title="Country Draft"
        description="8 countries, 8 stat categories. Assign each country to the category where it ranks highest globally. Beat the mathematically optimal solution."
        url="/games/country-draft"
        genre="Geography Strategy"
        playMode="SinglePlayer"
        rules={[
          "8 stat categories are shown upfront",
          "Countries are revealed one by one",
          "Assign each to its strongest category",
          "Your score is compared to the optimal",
        ]}
      />

      {/* Hero */}
      <section style={{ backgroundColor: "#fee2e2" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🎯</span>
              <span className="px-2.5 py-0.5 bg-gold text-white text-[10px] font-bold rounded-md uppercase tracking-wide">
                Flagship
              </span>
            </div>
            <h1
              className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight"
              style={{ color: "#991b1b" }}
            >
              Country Draft
            </h1>
            <p className="mt-3 text-base sm:text-lg text-cream-muted leading-relaxed max-w-md">
              8 categories. 8 countries. Assign each where it ranks highest
              globally — then see how close you got to the optimal solution.
            </p>

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: "#991b1b" }}>
              <span className="px-2 py-0.5 bg-black/5 rounded-full font-medium">8 picks</span>
              <span className="opacity-60">3-5 min</span>
              <span className="px-2 py-0.5 bg-black/5 rounded-full font-medium">Hard</span>
              <span className="px-2 py-0.5 bg-black/5 rounded-full">Strategy</span>
            </div>

            {/* Played today banner */}
            <div className="mt-4">
              <PlayedTodayBanner gameSlug="country-draft" playHref="/games/country-draft/play" />
            </div>

            {/* CTAs */}
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/games/country-draft/play?mode=daily"
                className="cta-primary"
              >
                Play today&apos;s challenge
              </Link>
              <Link
                href="/games/country-draft/play?mode=practice"
                className="cta-secondary"
              >
                Practice unlimited
              </Link>
            </div>
            <div className="mt-3">
              <Link
                href="/games/country-draft/leaderboard"
                className="text-sm font-medium text-cream-muted hover:text-cream transition-colors underline underline-offset-4"
                style={{ color: "#991b1b", opacity: 0.7 }}
              >
                View today&apos;s leaderboard →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — compact */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-xl font-extrabold mb-6">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          <StepCard
            number="1"
            emoji="📊"
            title="See 8 Categories"
            description="Population, GDP, Tourism — 8 random stat categories appear."
          />
          <StepCard
            number="2"
            emoji="🇩🇪"
            title="Countries Appear"
            description="Revealed one by one. You don't know what's coming."
          />
          <StepCard
            number="3"
            emoji="🎯"
            title="Make Your Pick"
            description="Assign each country to its strongest category."
          />
          <StepCard
            number="4"
            emoji="🏆"
            title="Beat the Optimal"
            description="Your score vs the mathematically best assignment."
          />
        </div>
      </section>

      {/* The Tension */}
      <section className="bg-surface-elevated border-y border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-xl font-extrabold mb-2">The Tension</h2>
          <p className="text-sm text-cream-muted mb-6">
            Every assignment is a gamble. You never know which countries come
            next.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <TensionCard
              emoji="🇩🇪"
              text="Germany is strong at Population AND Beer — but Czech Republic might appear next."
            />
            <TensionCard
              emoji="🇳🇬"
              text="Burn the Population slot on Nigeria now, or save it for India?"
            />
            <TensionCard
              emoji="😬"
              text="3 countries left and only weak categories remain."
            />
          </div>
        </div>
      </section>

      {/* Related games */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-lg font-extrabold mb-4">
          If you like this, try next
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <GameSuggestion
            href="/games/higher-or-lower"
            emoji="⬆️"
            title="Higher or Lower"
            desc="Which country ranks higher in a stat?"
          />
          <GameSuggestion
            href="/games/population-sort"
            emoji="📊"
            title="Population Sort"
            desc="Sort countries by a statistic."
          />
          <GameSuggestion
            href="/games/stat-guesser"
            emoji="🔢"
            title="Stat Guesser"
            desc="Guess the exact value of a stat."
          />
        </div>
      </section>
    </>
  );
}

function StepCard({
  number,
  emoji,
  title,
  description,
}: {
  number: string;
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className="relative p-5 rounded-xl"
      style={{ backgroundColor: "#fee2e2" }}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <span className="w-7 h-7 flex items-center justify-center bg-gold text-white text-xs font-bold rounded-lg">
          {number}
        </span>
        <span className="text-xl">{emoji}</span>
      </div>
      <h3 className="font-bold text-base">{title}</h3>
      <p className="text-sm text-cream-muted mt-1 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function TensionCard({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: "#fee2e2" }}>
      <span className="text-2xl block mb-2">{emoji}</span>
      <p className="text-sm text-cream-muted leading-relaxed italic">
        &ldquo;{text}&rdquo;
      </p>
    </div>
  );
}

function GameSuggestion({
  href,
  emoji,
  title,
  desc,
}: {
  href: string;
  emoji: string;
  title: string;
  desc: string;
}) {
  const slug = href.replace("/games/", "");
  const colors = getGameColor(slug);
  return (
    <Link
      href={href}
      className="game-card p-4 group"
      style={{ backgroundColor: colors.bg }}
    >
      <span className="text-2xl block mb-1">{emoji}</span>
      <h3 className="font-bold text-sm" style={{ color: colors.text }}>
        {title}
      </h3>
      <p className="text-xs text-cream-muted mt-0.5">{desc}</p>
    </Link>
  );
}
