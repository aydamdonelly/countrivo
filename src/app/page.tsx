import type { Metadata } from "next";
import type { SVGProps } from "react";
import Link from "next/link";
import { getFlagshipGame, getAllGames } from "@/lib/data/games";
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

/* ── hardcoded VS games (Task 23 will register them) ── */
const VS_SLUGS = ["supremacy", "borderline", "blitz"];

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
  const soloGames = allGames.filter(
    (g) => !g.isFlagship && !VS_SLUGS.includes(g.slug),
  );

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-6 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
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
          }),
        }}
      />
      {/* ═══ HERO ═══ */}
      <section className="mt-6 mb-8">
        <p className="text-xs font-semibold text-gold">Today&apos;s challenge</p>
        <h1 className="font-serif text-[30px] text-cream leading-tight mt-1">
          {flagship.title}
        </h1>
        <p className="text-sm text-cream-muted mt-2 leading-relaxed">
          {flagship.description}
        </p>
        <Link
          href={`${flagship.route}/play?mode=daily`}
          className="inline-flex items-center gap-1.5 mt-5 px-5 py-2.5 bg-gold text-bg text-sm font-semibold rounded-md hover:opacity-90 transition-opacity"
        >
          Play today <IconArrowRight width={14} height={14} />
        </Link>
      </section>

      {/* ── divider ── */}
      <div className="h-px bg-border" />

      {/* ═══ VERSUS ═══ */}
      <section className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-[13px] font-bold text-cream uppercase tracking-wide">
            Versus
          </h2>
          <span className="flex items-center gap-1 text-[11px] text-cream-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {VS_GAMES.map((vs) => {
            const Ico = GAME_ICONS[vs.slug] ?? IconGlobe;
            return (
              <Link
                key={vs.slug}
                href={`/games/${vs.slug}`}
                className="flex items-center gap-3.5 bg-surface/70 border border-border rounded-lg px-4 py-3.5 group"
              >
                <Ico
                  width={22}
                  height={22}
                  className="text-gold shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-[17px] text-cream leading-tight">
                    {vs.title}
                  </p>
                  <p className="text-xs text-cream-muted truncate">
                    {vs.desc}
                  </p>
                </div>
                <IconArrowRight
                  width={14}
                  height={14}
                  className="text-cream-muted shrink-0 group-hover:text-cream transition-colors"
                />
              </Link>
            );
          })}
        </div>

        {/* ── Join code row ── */}
        <div className="flex items-center gap-2.5 mt-4">
          <label className="text-[13px] font-bold text-cream uppercase tracking-wide shrink-0">
            Code
          </label>
          <input
            type="text"
            maxLength={4}
            placeholder="_ _ _ _"
            className="flex-1 bg-surface/70 border border-border rounded-md px-3 py-2 text-sm text-cream tracking-[6px] placeholder:text-cream-muted/40 focus:outline-none focus:border-gold/60 transition-colors text-center"
          />
          <button
            type="button"
            className="shrink-0 px-4 py-2 text-sm font-semibold text-gold border border-gold-dim rounded-md hover:bg-gold-dim/20 transition-colors"
          >
            Join
          </button>
        </div>
      </section>

      {/* ── divider ── */}
      <div className="h-px bg-border mt-6" />

      {/* ═══ SOLO ═══ */}
      <section className="mt-6">
        <h2 className="text-[13px] font-bold text-cream uppercase tracking-wide mb-4">
          Solo
        </h2>

        <ul className="flex flex-col">
          {soloGames.map((game, i) => {
            const Ico = GAME_ICONS[game.slug] ?? IconGlobe;
            const isLast = i === soloGames.length - 1;
            return (
              <li key={game.slug}>
                <Link
                  href={game.route}
                  className={`flex items-center gap-3 py-3 ${
                    isLast ? "" : "border-b border-border/60"
                  }`}
                >
                  <Ico
                    width={18}
                    height={18}
                    className="text-gold shrink-0"
                  />
                  <span className="text-sm font-semibold text-cream flex-1">
                    {game.title}
                  </span>
                  <span className="text-[11px] text-cream-muted capitalize">
                    {game.difficulty}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
