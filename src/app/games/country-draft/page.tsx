import Link from "next/link";
import type { Metadata } from "next";
import { GameJsonLd } from "@/components/seo/game-jsonld";

export const metadata: Metadata = {
  title: "Country Draft — Strategic Geography Assignment Game",
  description: "8 countries. 8 stat categories. Assign each country to where it ranks highest globally. Beat the optimal score. Free flagship geography game.",
  alternates: { canonical: "https://countrivo.com/games/country-draft" },
};

export default function CountryDraftPage() {
  return (
    <>
      <GameJsonLd
        name="Country Draft — Countrivo"
        title="Country Draft"
        description="8 countries, 8 stat categories. Assign each country to the category where it ranks highest globally. Beat the mathematically optimal solution."
        url="/games/country-draft"
        genre="Geography Strategy"
        playMode="SinglePlayer"
        rules={["See 8 stat categories", "Countries are revealed one by one", "Assign each country to its strongest stat category", "Your score is compared to the mathematically optimal assignment"]}
      />
      {/* Hero */}
      <section className="bg-bg text-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">🎯</span>
              <span className="px-3 py-1 bg-gold text-bg text-xs font-bold rounded-md uppercase tracking-wide">
                Flagship Game
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Country Draft
            </h1>
            <p className="mt-4 text-lg text-white/70 leading-relaxed max-w-xl">
              8 categories. 8 countries revealed one by one. Assign each country to
              the stat where it ranks highest — then see how you compare to the
              mathematically optimal solution.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/games/country-draft/play?mode=daily"
                className="px-6 py-3.5 bg-gold text-bg font-bold text-lg rounded-xl hover:opacity-90 transition-colors shadow-lg shadow-gold/25"
              >
                📅 Daily Challenge
              </Link>
              <Link
                href="/games/country-draft/play?mode=practice"
                className="px-6 py-3.5 bg-white/10 text-white font-semibold text-lg rounded-xl hover:bg-white/20 transition-colors"
              >
                🔄 Practice Mode
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How to play — visual, not text-wall */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-extrabold mb-8">How to Play</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
          <StepCard
            number="1"
            emoji="📊"
            title="See 8 Categories"
            description="Population, GDP, Beer Drinking, Tourism — 8 random stat categories are shown upfront."
          />
          <StepCard
            number="2"
            emoji="🇩🇪"
            title="Countries Appear"
            description="Countries are revealed one by one. You don't know what's coming next."
          />
          <StepCard
            number="3"
            emoji="🎯"
            title="Make Your Pick"
            description="Assign each country to the category where you think it ranks highest globally."
          />
          <StepCard
            number="4"
            emoji="🏆"
            title="Beat the Optimal"
            description="Your score is compared to the mathematically best possible assignment."
          />
        </div>
      </section>

      {/* Example tension */}
      <section className="bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-extrabold mb-3">The Tension</h2>
          <p className="text-cream-muted max-w-2xl mb-8">
            Every assignment is a gamble. You never know which countries are coming next.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TensionCard emoji="🇩🇪" text="Germany is great at Population AND Beer — but Czech Republic might appear next and they're #1 in Beer." />
            <TensionCard emoji="🇳🇬" text="Should you burn the Population slot on Nigeria now, or save it hoping India or China shows up?" />
            <TensionCard emoji="😬" text="3 countries left and only weak categories remain — you messed up your early assignments." />
          </div>
        </div>
      </section>

      {/* Related games */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-extrabold mb-6">If you like this, also try</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GameSuggestion href="/games/higher-or-lower" emoji="⬆️" title="Higher or Lower" desc="Which country ranks higher in a stat?" />
          <GameSuggestion href="/games/population-sort" emoji="📊" title="Population Sort" desc="Sort countries by a statistic." />
          <GameSuggestion href="/games/stat-guesser" emoji="🔢" title="Stat Guesser" desc="Guess the exact value of a stat." />
        </div>
      </section>
    </>
  );
}

function StepCard({ number, emoji, title, description }: { number: string; emoji: string; title: string; description: string }) {
  return (
    <div className="relative p-6 bg-surface border border-border rounded-xl">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-8 h-8 flex items-center justify-center bg-gold text-bg text-sm font-bold rounded-lg">
          {number}
        </span>
        <span className="text-2xl">{emoji}</span>
      </div>
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm text-cream-muted mt-2 leading-relaxed">{description}</p>
    </div>
  );
}

function TensionCard({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="p-5 bg-surface border border-border rounded-xl">
      <span className="text-3xl block mb-3">{emoji}</span>
      <p className="text-sm text-cream-muted leading-relaxed italic">&ldquo;{text}&rdquo;</p>
    </div>
  );
}

function GameSuggestion({ href, emoji, title, desc }: { href: string; emoji: string; title: string; desc: string }) {
  return (
    <Link href={href} className="game-card p-5 bg-surface border border-border group">
      <span className="text-3xl block mb-2">{emoji}</span>
      <h3 className="font-bold group-hover:text-gold transition-colors">{title}</h3>
      <p className="text-sm text-cream-muted mt-1">{desc}</p>
    </Link>
  );
}
