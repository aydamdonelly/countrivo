import Link from "next/link";
import { getAllGames, getFlagshipGame } from "@/lib/data/games";
import type { Metadata } from "next";
import { GAME_COLORS } from "@/lib/game-colors";
import { cn } from "@/lib/utils";
import { IconArrowRight } from "@/components/icons";

export const metadata: Metadata = {
  title: "All Geography Games | Free Quizzes, Puzzles & Daily Challenges",
  description:
    "Browse 14 free geography games: flag quizzes, country ranking puzzles, capitals matching, and real-time multiplayer. Daily challenges reset every day. No signup.",
  alternates: { canonical: "https://countrivo.com/games" },
};

export default function GamesPage() {
  const games = getAllGames();
  const flagship = getFlagshipGame();
  const rest = games.filter((g) => !g.isFlagship);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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

      {/* Hero with CTA */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            All Games
          </h1>
          <p className="text-base text-cream-muted mt-1 max-w-lg">
            {games.length} free geography games. Daily challenges reset at
            midnight. No account needed.
          </p>
        </div>
        <Link
          href={`${flagship.route}/play?mode=daily`}
          className="cta-primary text-base px-5 py-2.5 min-h-11 shrink-0"
        >
          Play daily challenge <IconArrowRight width={16} height={16} />
        </Link>
      </div>

      {/* Featured flagship */}
      <Link
        href={flagship.route}
        className="group relative block rounded-2xl p-6 sm:p-8 mb-6 transition-all hover:scale-[1.01] hover:shadow-lg overflow-hidden"
        style={{
          backgroundColor: GAME_COLORS[flagship.slug]?.bg ?? "#f3f4f6",
        }}
      >
        <span className="absolute -right-4 -bottom-4 text-[7rem] opacity-[0.10] select-none pointer-events-none leading-none">
          {flagship.emoji}
        </span>
        <span className="inline-block px-2.5 py-0.5 bg-gold text-white text-[10px] font-bold uppercase rounded-md mb-3 tracking-wide">
          Featured
        </span>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2
              className="text-2xl sm:text-3xl font-extrabold"
              style={{
                color: GAME_COLORS[flagship.slug]?.text ?? "#374151",
              }}
            >
              {flagship.emoji} {flagship.title}
            </h2>
            <p
              className="mt-2 text-base opacity-70 max-w-md"
              style={{
                color: GAME_COLORS[flagship.slug]?.text ?? "#374151",
              }}
            >
              {flagship.shortDescription}
            </p>
            <div
              className="mt-3 flex items-center gap-3 text-xs"
              style={{
                color: GAME_COLORS[flagship.slug]?.text ?? "#374151",
              }}
            >
              <span className="px-2 py-0.5 bg-black/5 rounded-full font-medium capitalize">
                {flagship.difficulty}
              </span>
              <span className="opacity-60">{flagship.estimatedTime}</span>
              <span className="px-2 py-0.5 bg-black/5 rounded-full capitalize">
                {flagship.category}
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Game grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {rest.map((game) => {
          const colors = GAME_COLORS[game.slug] ?? {
            bg: "#f3f4f6",
            text: "#374151",
          };
          return (
            <Link
              key={game.slug}
              href={game.route}
              className="group relative game-card p-5 overflow-hidden"
              style={{ backgroundColor: colors.bg }}
            >
              <span className="absolute -right-3 -bottom-3 text-[4rem] opacity-[0.10] select-none pointer-events-none leading-none">
                {game.emoji}
              </span>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{game.emoji}</span>
                {game.isNew && (
                  <span
                    className="px-2 py-0.5 bg-black/10 text-[10px] font-bold rounded-full uppercase"
                    style={{ color: colors.text }}
                  >
                    New
                  </span>
                )}
              </div>
              <h2
                className="font-bold text-lg"
                style={{ color: colors.text }}
              >
                {game.title}
              </h2>
              <p
                className="mt-1 text-sm leading-snug opacity-70"
                style={{ color: colors.text }}
              >
                {game.shortDescription}
              </p>
              <div
                className="mt-2.5 flex items-center gap-3 text-xs"
                style={{ color: colors.text }}
              >
                <span className="px-2 py-0.5 bg-black/5 rounded-full font-medium capitalize">
                  {game.difficulty}
                </span>
                <span className="opacity-60">{game.estimatedTime}</span>
                <span className="px-2 py-0.5 bg-black/5 rounded-full capitalize">
                  {game.category}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* SEO text */}
      <section className="mt-12 pt-10 border-t border-border">
        <h2 className="text-xl font-extrabold mb-3">
          About Countrivo Games
        </h2>
        <div className="max-w-2xl space-y-3 text-sm text-cream-muted leading-relaxed">
          <p>
            Countrivo offers {games.length} free geography games that test your
            knowledge of countries, flags, capitals, and world statistics.
            Every game features a daily challenge with the same puzzle for all
            players worldwide, plus unlimited practice mode. No account needed.
          </p>
          <p>
            From strategy puzzles like <strong>Country Draft</strong> to
            speed challenges like <strong>Speed Flags</strong> and{" "}
            <strong>Blitz</strong>, there&apos;s a game for every level. All
            games are free, work in any browser, and cover 243 countries.
          </p>
        </div>
      </section>
    </div>
  );
}
