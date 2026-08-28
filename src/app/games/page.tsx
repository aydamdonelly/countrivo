import Link from "next/link";
import { getAllGames, getFlagshipGame, getMainGames, getDrillGames } from "@/lib/data/games";
import type { Metadata } from "next";
import { GAME_COLORS } from "@/lib/game-colors";
import { IconArrowRight, IconTrophy } from "@/components/icons";
import type { GameMeta } from "@/types/game";

export const metadata: Metadata = {
  title: "All Geography Games | Free Quizzes, Puzzles & Daily Challenges",
  description:
    "Browse Countrivo's geography games: daily puzzles, country rankings, capitals matching, and quick-fire practice drills. Daily challenges reset every day. No signup.",
  alternates: { canonical: "https://countrivo.com/games" },
};

interface GamesPageProps {
  searchParams?: Promise<{ show?: string }>;
}

function GameCard({ game }: { game: GameMeta }) {
  const colors = GAME_COLORS[game.slug] ?? {
    bg: "#f3f4f6",
    text: "#374151",
  };
  const hasDaily = game.availableModes.includes("daily");
  return (
    <div className="relative">
    <Link
      href={game.route}
      className="group relative block game-card p-5 overflow-hidden"
      style={{ backgroundColor: colors.bg }}
    >
      <span className="absolute -right-3 -bottom-3 text-[4rem] opacity-[0.10] select-none pointer-events-none leading-none">
        {game.emoji}
      </span>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{game.emoji}</span>
        {game.isNew && (
          <span
            className="px-2 py-0.5 bg-black/10 text-xxs font-bold rounded-full uppercase"
            style={{ color: colors.text }}
          >
            New
          </span>
        )}
      </div>
      <h2 className="font-bold text-lg" style={{ color: colors.text }}>
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
      {hasDaily && (
        <Link
          href={`/games/${game.slug}/leaderboard`}
          className="absolute right-3 bottom-3 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/10 text-xxs font-bold transition-[background-color,transform] duration-150 ease-[var(--ease-out)] hover:bg-black/20 active:scale-95"
          style={{ color: colors.text }}
        >
          <IconTrophy width={12} height={12} aria-hidden />
          Leaderboard
        </Link>
      )}
    </div>
  );
}

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const params = (await searchParams) ?? {};
  const showDrills = params.show === "drills";
  const games = getAllGames();
  const flagship = getFlagshipGame();
  const mainGames = getMainGames();
  const drillGames = getDrillGames();
  const mainRest = mainGames.filter((g) => !g.isFlagship);

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
                  text: "Countrivo offers daily geography puzzles plus a deep library of practice drills. The headline games are Country Draft and Stat Guesser. All games have daily challenges and unlimited practice mode. No signup required.",
                },
              },
              {
                "@type": "Question",
                name: "Do I need to create an account to play?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. All games on Countrivo are completely free with no account or signup required. Just open the site and start playing.",
                },
              },
              {
                "@type": "Question",
                name: "Are there daily geography challenges?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. Every main game on Countrivo has a daily challenge mode with the same puzzle for all players worldwide, resetting at midnight. There is also unlimited practice mode and quick-fire drills.",
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
            {mainGames.length} daily games, {drillGames.length} practice drills.
            Daily challenges reset at midnight. No account needed.
          </p>
        </div>
        <Link
          href={`${flagship.route}/play?mode=daily`}
          className="cta-primary text-base px-5 py-2.5 min-h-11 shrink-0"
        >
          Play daily challenge <IconArrowRight width={16} height={16} />
        </Link>
      </div>

      {/* Tab bar — Main / Drills */}
      <div className="flex items-center gap-2 mb-6 border-b border-border">
        <Link
          href="/games"
          className={
            !showDrills
              ? "px-3 py-2 text-sm font-bold border-b-2 border-gold -mb-px transition-colors"
              : "px-3 py-2 text-sm font-medium text-cream-muted hover:text-cream transition-colors"
          }
        >
          Daily games <span className="text-xs opacity-60">({mainGames.length})</span>
        </Link>
        <Link
          href="/games?show=drills"
          className={
            showDrills
              ? "px-3 py-2 text-sm font-bold border-b-2 border-gold -mb-px transition-colors"
              : "px-3 py-2 text-sm font-medium text-cream-muted hover:text-cream transition-colors"
          }
        >
          Drills <span className="text-xs opacity-60">({drillGames.length})</span>
        </Link>
      </div>

      {!showDrills && (
        <>
          {/* Featured flagship */}
          <Link
            href={flagship.route}
            className="group relative block rounded-2xl p-6 sm:p-8 mb-6 overflow-hidden transition-[transform,box-shadow] duration-200 ease-[var(--ease-game)] hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99]"
            style={{
              backgroundColor: GAME_COLORS[flagship.slug]?.bg ?? "#f3f4f6",
              contain: "paint",
            }}
          >
            <span className="absolute -right-4 -bottom-4 text-[7rem] opacity-[0.10] select-none pointer-events-none leading-none">
              {flagship.emoji}
            </span>
            <span className="inline-block px-2.5 py-0.5 bg-gold text-white text-xxs font-bold uppercase rounded-md mb-3 tracking-wide">
              Featured
            </span>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h2
                  className="text-2xl sm:text-3xl font-extrabold font-display"
                  style={{ color: GAME_COLORS[flagship.slug]?.text ?? "#374151" }}
                >
                  {flagship.emoji} {flagship.title}
                </h2>
                <p
                  className="mt-2 text-base opacity-70 max-w-md"
                  style={{ color: GAME_COLORS[flagship.slug]?.text ?? "#374151" }}
                >
                  {flagship.shortDescription}
                </p>
                <div
                  className="mt-3 flex items-center gap-3 text-xs"
                  style={{ color: GAME_COLORS[flagship.slug]?.text ?? "#374151" }}
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

          {/* Main games grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 stagger-children">
            {mainRest.map((game) => (
              <GameCard key={game.slug} game={game} />
            ))}
          </div>

          {/* Drills teaser */}
          <section className="mt-10 p-4 rounded-xl bg-surface-elevated border border-border">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold">Looking for quick practice?</h3>
                <p className="text-xs text-cream-muted mt-0.5">
                  {drillGames.length} drill games for free-form practice rounds.
                </p>
              </div>
              <Link href="/games?show=drills" className="cta-tertiary text-xs shrink-0">
                See drills →
              </Link>
            </div>
          </section>
        </>
      )}

      {showDrills && (
        <>
          <div className="mb-4">
            <h2 className="text-xl font-extrabold">Drills</h2>
            <p className="text-sm text-cream-muted mt-1">
              Quick practice rounds. No daily ritual, no leaderboard pressure.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 stagger-children">
            {drillGames.map((game) => (
              <GameCard key={game.slug} game={game} />
            ))}
          </div>
        </>
      )}

      {/* SEO text */}
      <section className="mt-12 pt-10 border-t border-border">
        <h2 className="text-xl font-extrabold mb-3">
          About Countrivo Games
        </h2>
        <div className="max-w-2xl space-y-3 text-sm text-cream-muted leading-relaxed">
          <p>
            Countrivo offers {mainGames.length} curated daily geography games and{" "}
            {drillGames.length} quick-fire practice drills. Every main game has a
            daily challenge — the same puzzle for all players worldwide — plus
            unlimited practice mode. No account needed.
          </p>
          <p>
            The daily anchor is <strong>Country Draft</strong>: 8 picks, 8 categories,
            one optimal score to beat. Drills cover the classics — flag quizzes,
            capital matching, border puzzles — without the daily-ritual pressure.
            All games are free, work in any browser, and cover 243 countries.
          </p>
        </div>
      </section>
    </div>
  );
}
