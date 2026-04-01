import Link from "next/link";
import { GameJsonLd } from "@/components/seo/game-jsonld";
import { CreateGameButton } from "@/components/games/blitz/create-game-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blitz | Type the Country Name Before Time Runs Out",
  description: "A flag appears. Type the country name as fast as you can. 10 rounds of pure speed. Race a friend or beat your own time.",
  alternates: { canonical: "https://countrivo.com/games/blitz" },
};

export default function BlitzPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <GameJsonLd
        name="Blitz - Flag Speed Challenge | Countrivo"
        description="See a flag, type the country name. Race against the clock in solo mode or challenge a friend in real-time. 10 rounds, fastest correct answer wins each round."
        url="/games/blitz"
        genre="Geography speed"
        playMode="MultiPlayer"
      />

      {/* Hero */}
      <div className="bg-surface border-b border-border px-4 py-12 sm:py-16 text-center -mx-4 sm:-mx-6 lg:-mx-8">
        <span className="text-7xl mb-4 block">⚡</span>
        <h1 className="text-4xl sm:text-5xl font-extrabold">Blitz</h1>
        <p className="text-cream-muted text-lg mt-3 max-w-xl mx-auto">
          A flag appears. Type the country name as fast as you can. 10 rounds of
          pure speed. Play solo for time or race a friend head-to-head.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-4 px-4 mt-10 max-w-xl mx-auto">
        <CreateGameButton />

        <Link
          href="/games/blitz/play?mode=practice"
          className="block py-5 px-8 rounded-xl border-2 border-border hover:border-border hover:bg-surface transition-all text-center"
        >
          <div className="text-3xl mb-2">🏋️</div>
          <h2 className="text-xl font-bold">Practice Solo</h2>
          <p className="text-base text-cream-muted mt-1">
            Test your flag knowledge and speed. Score based on accuracy and time.
          </p>
        </Link>
      </div>

      {/* How to Play */}
      <div className="mt-12 px-4 sm:px-0 p-8 bg-surface rounded-xl max-w-xl mx-auto">
        <h3 className="font-bold text-xl mb-4">How to Play</h3>
        <ol className="space-y-3 text-base text-cream-muted">
          {[
            "A flag appears on screen. Identify the country",
            "Type the country name and press Enter",
            "Correct answer wins the round; wrong answer lets you try again",
            "In versus mode, first correct answer wins the round",
            "After 10 rounds, the player with the most wins takes the game",
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
            { href: "/games/flag-quiz", emoji: "🏁", name: "Flag Quiz" },
            { href: "/games/speed-flags", emoji: "⚡", name: "Speed Flags" },
            { href: "/games/country-streak", emoji: "🔥", name: "Country Streak" },
            { href: "/games/supremacy", emoji: "👑", name: "Supremacy" },
            { href: "/games/borderline", emoji: "🗺️", name: "Borderline" },
            { href: "/games/higher-or-lower", emoji: "⬆️", name: "Higher or Lower" },
          ].map((g) => (
            <Link
              key={g.href}
              href={g.href}
              className="game-card p-5 border border-black/5 bg-white shadow-sm text-center"
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
