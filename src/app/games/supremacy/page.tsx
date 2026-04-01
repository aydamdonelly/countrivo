import Link from "next/link";
import { GameJsonLd } from "@/components/seo/game-jsonld";
import { CreateGameButton } from "@/components/games/supremacy/create-game-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Supremacy | Country Stats Card Battle Game",
  description: "Top Trumps with real country data. Pick the stat category, compare cards, and outsmart your opponent. Real-time multiplayer geography game.",
  alternates: { canonical: "https://countrivo.com/games/supremacy" },
};

export default function SupremacyPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <GameJsonLd
        name="Supremacy - Real-Time Country Stat Battle | Countrivo"
        description="A Top Trumps style card game with real country data. Pick the stat category, compare cards, and outsmart your opponent across 5 rounds."
        url="/games/supremacy"
        genre="Geography strategy"
        playMode="MultiPlayer"
      />

      {/* Hero */}
      <div className="bg-surface border-b border-border px-4 py-12 sm:py-16 text-center -mx-4 sm:-mx-6 lg:-mx-8">
        <span className="text-7xl mb-4 block">👑</span>
        <h1 className="text-4xl sm:text-5xl font-extrabold">Supremacy</h1>
        <p className="text-cream-muted text-lg mt-3 max-w-xl mx-auto">
          A Top Trumps card battle using real country stats. Pick the right
          category, compare cards, and claim victory across 5 rounds.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-4 px-4 mt-10 max-w-xl mx-auto">
        <CreateGameButton />

        <Link
          href="/games/supremacy/play?mode=practice"
          className="block py-5 px-8 rounded-xl border-2 border-border hover:border-border hover:bg-surface transition-all text-center"
        >
          <div className="text-3xl mb-2">🤖</div>
          <h2 className="text-xl font-bold">Practice vs AI</h2>
          <p className="text-base text-cream-muted mt-1">
            Play against a simple AI. Unlimited rounds.
          </p>
        </Link>
      </div>

      {/* How to Play */}
      <div className="mt-12 px-4 sm:px-0 p-8 bg-surface rounded-xl max-w-xl mx-auto">
        <h3 className="font-bold text-xl mb-4">How to Play</h3>
        <ol className="space-y-3 text-base text-cream-muted">
          {[
            "Each player gets 5 country cards with real stats",
            "The attacker picks a stat category to compare",
            "Both cards are revealed — higher value wins the round",
            "Players alternate who picks for 5 rounds",
            "Most rounds won takes the game",
          ].map((rule, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-7 h-7 rounded-full bg-gold-dim text-gold font-bold text-sm flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              {rule}
            </li>
          ))}
        </ol>
      </div>

      {/* Related games */}
      <div className="mt-12 px-4 pb-8">
        <h3 className="font-bold text-lg text-cream-muted uppercase tracking-wide mb-4 text-center">
          More Games
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-xl mx-auto">
          {[
            { href: "/games/higher-or-lower", emoji: "⬆️", name: "Higher or Lower" },
            { href: "/games/country-draft", emoji: "🎯", name: "Country Draft" },
            { href: "/games/stat-guesser", emoji: "🔢", name: "Stat Guesser" },
            { href: "/games/flag-quiz", emoji: "🏁", name: "Flag Quiz" },
            { href: "/games/population-sort", emoji: "📊", name: "Population Sort" },
            { href: "/games/country-streak", emoji: "🔥", name: "Country Streak" },
          ].map((g) => (
            <Link
              key={g.href}
              href={g.href}
              className="game-card p-5 border border-border bg-surface text-center"
            >
              <span className="text-3xl block mb-2">{g.emoji}</span>
              <span className="text-base font-bold">{g.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
