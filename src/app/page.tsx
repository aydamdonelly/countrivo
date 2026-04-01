import type { Metadata } from "next";
import Link from "next/link";
import { getFlagshipGame, getAllGames } from "@/lib/data/games";
import { JoinCodeInput } from "@/components/join-code-input";
import { IconArrowRight } from "@/components/icons";
import { GAME_COLORS } from "@/lib/game-colors";

export const metadata: Metadata = {
  title: "Countrivo | Free Geography Games & Daily Challenges",
  description: "14 free geography games: flag quizzes, daily challenges, country rankings, and capital matching. 243 countries. No signup needed.",
};

const VS_GAMES = [
  { slug: "supremacy", emoji: "👑", title: "Supremacy", desc: "Draft countries head-to-head and outlast your rival." },
  { slug: "borderline", emoji: "🗺️", title: "Borderline", desc: "Race to connect a chain of bordering countries first." },
  { slug: "blitz", emoji: "⚡", title: "Blitz", desc: "Speed-round flag quiz. Fastest correct answer wins." },
];

export default function HomePage() {
  const flagship = getFlagshipGame();
  const allGames = getAllGames();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Countrivo Geography Games",
          numberOfItems: allGames.length,
          itemListElement: allGames.map((g, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: g.title,
            url: `https://countrivo.com${g.route}`,
          })),
        })}}
      />

      {/* Hero */}
      <section className="text-center py-12 sm:py-16">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
          Geography Games
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-cream-muted max-w-2xl mx-auto">
          14 free games. 243 countries. Test what you know about the world.
        </p>
        <Link
          href={`${flagship.route}/play?mode=daily`}
          className="inline-flex items-center gap-2 mt-8 px-8 py-3.5 bg-black text-white font-bold text-lg rounded-full hover:bg-black/80 transition-colors shadow-lg"
        >
          Play today&apos;s challenge <IconArrowRight width={16} height={16} />
        </Link>
      </section>

      {/* Game Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {allGames.map((game) => {
          const colors = GAME_COLORS[game.slug] ?? { bg: "#f3f4f6", text: "#374151" };
          return (
            <Link
              key={game.slug}
              href={game.route}
              className="group relative rounded-2xl p-5 sm:p-6 transition-all hover:scale-[1.03] hover:shadow-lg overflow-hidden"
              style={{ backgroundColor: colors.bg }}
            >
              {/* Decorative watermark */}
              <span className="absolute -right-2 -bottom-2 text-[4rem] opacity-[0.15] select-none pointer-events-none leading-none">
                {game.emoji}
              </span>

              {game.isFlagship && (
                <span className="absolute top-3 right-3 px-2 py-0.5 bg-black/10 text-[10px] font-bold uppercase rounded-full" style={{ color: colors.text }}>
                  Featured
                </span>
              )}
              {game.isNew && (
                <span className="absolute top-3 right-3 px-2 py-0.5 bg-black/10 text-[10px] font-bold uppercase rounded-full" style={{ color: colors.text }}>
                  New
                </span>
              )}
              <span className="text-3xl block mb-3">{game.emoji}</span>
              <h2 className="font-bold text-lg leading-tight" style={{ color: colors.text }}>
                {game.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed opacity-60" style={{ color: colors.text }}>
                {game.shortDescription}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-black/5 capitalize" style={{ color: colors.text }}>
                  {game.difficulty}
                </span>
                <span className="text-xs opacity-50" style={{ color: colors.text }}>
                  {game.estimatedTime}
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      {/* VS / Multiplayer */}
      <section className="mt-16">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-extrabold">Play with Friends</h2>
          <span className="flex items-center gap-1.5 text-sm text-cream-muted">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {VS_GAMES.map((vs) => {
            const colors = GAME_COLORS[vs.slug] ?? { bg: "#f3f4f6", text: "#374151" };
            return (
              <Link
                key={vs.slug}
                href={`/games/${vs.slug}`}
                className="flex items-center gap-4 rounded-2xl p-4 transition-all hover:scale-[1.02] hover:shadow-md"
                style={{ backgroundColor: colors.bg }}
              >
                <span className="text-3xl shrink-0">{vs.emoji}</span>
                <div className="min-w-0">
                  <h3 className="font-bold" style={{ color: colors.text }}>{vs.title}</h3>
                  <p className="text-sm opacity-60 truncate" style={{ color: colors.text }}>{vs.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <JoinCodeInput />
      </section>
    </div>
  );
}
