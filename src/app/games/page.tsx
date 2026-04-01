import Link from "next/link";
import { getAllGames } from "@/lib/data/games";
import type { Metadata } from "next";
import { GAME_COLORS } from "@/lib/game-colors";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "All Geography Games | Free Quizzes, Puzzles & Daily Challenges",
  description:
    "Browse 14 free geography games: flag quizzes, country ranking puzzles, capitals matching, and real-time multiplayer. Daily challenges reset every day. No signup.",
  alternates: { canonical: "https://countrivo.com/games" },
};

export default function GamesPage() {
  const games = getAllGames();

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "What are the best free geography games online?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Countrivo offers 14 free geography games including Flag Quiz, Country Draft, Higher or Lower, Capital Match, and Population Sort. All games have daily challenges and unlimited practice mode. No signup required.",
                },
              },
              {
                "@type": "Question",
                name: "Do I need to create an account to play?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. All 14 games on Countrivo are completely free with no account or signup required. Just open the site and start playing.",
                },
              },
              {
                "@type": "Question",
                name: "Are there daily geography challenges?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. Every game on Countrivo has a daily challenge mode with the same puzzle for all players worldwide, resetting at midnight. There is also unlimited practice mode.",
                },
              },
              {
                "@type": "Question",
                name: "How many countries are covered in the geography games?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Countrivo covers 243 countries and territories across all continents. Games include flags, capitals, population statistics, GDP, borders, and more.",
                },
              },
            ],
          }),
        }}
      />

      <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">All Geography Games</h1>
      <p className="text-lg text-cream-muted mb-10 max-w-2xl">
        {games.length} free geography games with daily challenges, practice mode, and shareable results. No account needed — just pick a game and play.
      </p>

      {/* All games — colorful grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
        {games.map((game) => {
          const colors = GAME_COLORS[game.slug] ?? { bg: "#f3f4f6", text: "#374151" };
          return (
            <Link
              key={game.slug}
              href={game.route}
              className={cn(
                "group relative rounded-2xl p-6 transition-all hover:scale-[1.02] hover:shadow-lg overflow-hidden",
                game.isFlagship && "sm:col-span-2"
              )}
              style={{ backgroundColor: colors.bg }}
            >
              <span className="absolute -right-3 -bottom-3 text-[5rem] opacity-[0.12] select-none pointer-events-none leading-none">
                {game.emoji}
              </span>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{game.emoji}</span>
                {game.isFlagship && (
                  <span className="px-2.5 py-0.5 bg-black/10 text-[10px] font-bold rounded-full uppercase" style={{ color: colors.text }}>Featured</span>
                )}
                {game.isNew && (
                  <span className="px-2.5 py-0.5 bg-black/10 text-[10px] font-bold rounded-full uppercase" style={{ color: colors.text }}>New</span>
                )}
              </div>
              <h2 className="font-bold text-xl" style={{ color: colors.text }}>
                {game.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed opacity-70" style={{ color: colors.text }}>
                {game.description}
              </p>
              <div className="mt-3 flex items-center gap-3 text-xs" style={{ color: colors.text }}>
                <span className="px-2 py-0.5 bg-black/5 rounded-full font-medium capitalize">{game.difficulty}</span>
                <span className="opacity-60">{game.estimatedTime}</span>
                <span className="px-2 py-0.5 bg-black/5 rounded-full capitalize">{game.category}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* SEO text */}
      <section className="mt-12 pt-12 border-t border-border">
        <h2 className="text-2xl font-extrabold mb-4">About Our Geography Games</h2>
        <div className="max-w-3xl space-y-4 text-cream-muted leading-relaxed">
          <p>
            Countrivo offers {games.length} free geography games that test your knowledge of
            countries, flags, capitals, and world statistics. Every game features a daily challenge
            with the same puzzle for all players worldwide, plus unlimited practice mode.
            No account or signup needed — just open the site and start playing.
          </p>
          <p>
            From strategy puzzles like <strong>Country Draft</strong> (assign countries to their
            strongest stat categories) to fast-paced flag quizzes like <strong>Speed Flags</strong>,
            there&apos;s something for every level of geography knowledge.
            Our <strong>flag quiz online</strong> and <strong>world capitals quiz</strong> are
            perfect for students, travelers, and geography enthusiasts alike.
          </p>
          <p>
            All games are free, work in any web browser, and cover 243 countries across every
            continent. Use the daily challenge to build a streak, or switch to practice mode for
            unlimited geography trivia whenever you want.
          </p>
        </div>
      </section>
    </div>
  );
}
