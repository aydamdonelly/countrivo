import Link from "next/link";
import { getAllGames } from "@/lib/data/games";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Geography Games — Free Quizzes, Puzzles & Daily Challenges",
  description:
    "Browse 11 free geography games. Flag quizzes, country ranking games, capital matching, strategy puzzles, and more. Daily challenges available. No signup needed.",
};

export default function GamesPage() {
  const games = getAllGames();
  const flagship = games.find((g) => g.isFlagship);
  const others = games.filter((g) => !g.isFlagship);

  const byCategory = {
    quiz: others.filter((g) => g.category === "quiz"),
    ranking: others.filter((g) => g.category === "ranking"),
    strategy: others.filter((g) => g.category === "strategy"),
    speed: others.filter((g) => g.category === "speed"),
    knowledge: others.filter((g) => g.category === "knowledge"),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Countrivo Geography Games",
            numberOfItems: games.length,
            itemListElement: games.map((g, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: g.title,
              url: `https://countrivo.com${g.route}`,
            })),
          }),
        }}
      />

      <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">All Geography Games</h1>
      <p className="text-lg text-cream-muted mb-10 max-w-2xl">
        {games.length} free geography games with daily challenges, practice mode, and shareable results. No account needed — just pick a game and play.
      </p>

      {/* Flagship */}
      {flagship && (
        <Link
          href={flagship.route}
          className="game-card block bg-surface border border-border p-6 sm:p-8 mb-10 group"
        >
          <div className="flex items-center gap-6">
            <span className="text-5xl shrink-0">{flagship.emoji}</span>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-extrabold group-hover:text-gold transition-colors">{flagship.title}</h2>
                <span className="px-2.5 py-1 bg-gold text-white text-xs font-bold rounded-md uppercase">Featured</span>
              </div>
              <p className="text-cream-muted">{flagship.description}</p>
            </div>
          </div>
        </Link>
      )}

      {/* Categorized grid */}
      {Object.entries(byCategory).map(([cat, gamesList]) => {
        if (gamesList.length === 0) return null;
        const catLabel = { quiz: "Quizzes", ranking: "Ranking Games", strategy: "Strategy", speed: "Speed Games", knowledge: "Knowledge" }[cat] || cat;
        return (
          <section key={cat} className="mb-12">
            <h2 className="text-2xl font-extrabold mb-4 capitalize">{catLabel}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gamesList.map((game) => (
                <Link
                  key={game.slug}
                  href={game.route}
                  className="game-card bg-surface border border-border p-5 group"
                >
                  <span className="text-4xl block mb-3">{game.emoji}</span>
                  <h3 className="text-lg font-bold group-hover:text-gold transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-sm text-cream-muted mt-1">{game.shortDescription}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-cream-muted">
                    <span className="px-2 py-0.5 bg-surface rounded-md">{game.estimatedTime}</span>
                    <span className="px-2 py-0.5 bg-surface rounded-md capitalize">{game.difficulty}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {/* SEO text */}
      <section className="mt-12 pt-12 border-t border-border">
        <h2 className="text-2xl font-extrabold mb-4">About Our Geography Games</h2>
        <div className="max-w-3xl space-y-4 text-cream-muted leading-relaxed">
          <p>
            Countrivo offers {games.length} free geography games that test your knowledge of
            countries, flags, capitals, and world statistics. Each game features a daily challenge
            with the same puzzle for all players, plus unlimited practice mode.
          </p>
          <p>
            From strategy puzzles like <strong>Country Draft</strong> to fast-paced challenges like
            <strong> Speed Flags</strong>, there&apos;s something for every level of geography knowledge.
            All games are free, work in your browser, and don&apos;t require an account.
          </p>
        </div>
      </section>
    </div>
  );
}
