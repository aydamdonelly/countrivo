import type { Metadata } from "next";
import type { SVGProps } from "react";
import Link from "next/link";
import { getFlagshipGame, getAllGames } from "@/lib/data/games";
import { JoinCodeInput } from "@/components/join-code-input";
import {
  IconTarget,
  IconScale,
  IconPath,
  IconBolt,
  IconFlag,
  IconChevronDouble,
  IconBars,
  IconPin,
  IconCheck,
  IconClock,
  IconSearch,
  IconChain,
  IconGlobe,
  IconHash,
  IconArrowRight,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Countrivo | Free Geography Games & Daily Challenges",
  description: "14 free geography games: flag quizzes, daily challenges, country rankings, and capital matching. 243 countries. No signup needed.",
};

/* ── icon map ── */
const GAME_ICONS: Record<string, React.ComponentType<SVGProps<SVGSVGElement>>> = {
  "country-draft": IconTarget,
  "flag-quiz": IconFlag,
  "higher-or-lower": IconChevronDouble,
  "capital-match": IconPin,
  "population-sort": IconBars,
  "country-streak": IconCheck,
  "border-buddies": IconChain,
  "continent-sprint": IconGlobe,
  "stat-guesser": IconHash,
  "speed-flags": IconClock,
  "odd-one-out": IconSearch,
  supremacy: IconScale,
  borderline: IconPath,
  blitz: IconBolt,
};

/* ── color map — each game gets its own card color ── */
const GAME_COLORS: Record<string, { bg: string; text: string }> = {
  "country-draft":   { bg: "#fee2e2", text: "#991b1b" },
  "flag-quiz":       { bg: "#dbeafe", text: "#1e3a5f" },
  "higher-or-lower": { bg: "#d1fae5", text: "#064e3b" },
  "capital-match":   { bg: "#fef3c7", text: "#78350f" },
  "population-sort": { bg: "#ede9fe", text: "#4c1d95" },
  "country-streak":  { bg: "#ffedd5", text: "#7c2d12" },
  "border-buddies":  { bg: "#ccfbf1", text: "#134e4a" },
  "continent-sprint":{ bg: "#e0e7ff", text: "#312e81" },
  "stat-guesser":    { bg: "#fce7f3", text: "#831843" },
  "speed-flags":     { bg: "#ecfccb", text: "#365314" },
  "odd-one-out":     { bg: "#f3e8ff", text: "#581c87" },
  "supremacy":       { bg: "#fef9c3", text: "#713f12" },
  "borderline":      { bg: "#cffafe", text: "#155e75" },
  "blitz":           { bg: "#fecaca", text: "#7f1d1d" },
};

/* ── hardcoded VS games ── */
const VS_GAMES = [
  {
    slug: "supremacy",
    title: "Supremacy",
    desc: "Draft countries head-to-head and outlast your rival.",
  },
  {
    slug: "borderline",
    title: "Borderline",
    desc: "Race to connect a chain of bordering countries first.",
  },
  {
    slug: "blitz",
    title: "Blitz",
    desc: "Speed-round flag quiz — fastest correct answer wins.",
  },
];

export default function HomePage() {
  const flagship = getFlagshipGame();
  const allGames = getAllGames();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      {/* JSON-LD */}
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
          className="inline-flex items-center gap-2 mt-8 px-8 py-3.5 bg-cream text-bg font-bold text-lg rounded-full hover:opacity-90 transition-opacity"
        >
          Play today&apos;s challenge <IconArrowRight width={16} height={16} />
        </Link>
      </section>

      {/* Game Grid — each card has its own color */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {allGames.map((game) => {
          const colors = GAME_COLORS[game.slug] ?? { bg: "#f3f4f6", text: "#374151" };
          const Ico = GAME_ICONS[game.slug] ?? IconGlobe;
          return (
            <Link
              key={game.slug}
              href={game.route}
              className="group relative rounded-2xl p-5 sm:p-6 transition-all hover:scale-[1.03] hover:shadow-lg"
              style={{ backgroundColor: colors.bg }}
            >
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
              <Ico width={28} height={28} style={{ color: colors.text }} className="mb-3 opacity-70" />
              <h2 className="font-bold text-lg leading-tight" style={{ color: colors.text }}>
                {game.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed opacity-75" style={{ color: colors.text }}>
                {game.shortDescription}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-black/5" style={{ color: colors.text }}>
                  {game.difficulty}
                </span>
                <span className="text-xs opacity-60" style={{ color: colors.text }}>
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
            const Ico = GAME_ICONS[vs.slug] ?? IconGlobe;
            return (
              <Link
                key={vs.slug}
                href={`/games/${vs.slug}`}
                className="rounded-2xl p-5 transition-all hover:scale-[1.02] hover:shadow-md"
                style={{ backgroundColor: colors.bg }}
              >
                <Ico width={24} height={24} style={{ color: colors.text }} className="mb-2 opacity-70" />
                <h3 className="font-bold text-lg" style={{ color: colors.text }}>{vs.title}</h3>
                <p className="text-sm mt-1 opacity-70" style={{ color: colors.text }}>{vs.desc}</p>
              </Link>
            );
          })}
        </div>

        <JoinCodeInput />
      </section>
    </div>
  );
}
