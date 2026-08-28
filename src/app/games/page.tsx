import type { Metadata } from "next";
import Link from "next/link";
import { getAllGames } from "@/lib/data/games";
import { GameRow } from "@/components/home/game-list";
import { GameMark } from "@/components/home/game-mark";

export const metadata: Metadata = {
  title: "All Geography Games: Daily Puzzles, Flag & Capital Quizzes, Country Draft",
  description:
    "Every Countrivo game in one place: daily one-shot puzzles like Country Draft, GeoWordle and Cluster, plus flag, capital and border quizzes to practice. Free, no signup.",
  alternates: { canonical: "https://countrivo.com/games" },
};

export default function GamesPage() {
  const games = getAllGames();
  const dailies = games.filter((g) => g.availableModes.includes("daily"));
  const mainDailies = dailies.filter((g) => g.tier === "main");
  const drillDailies = dailies.filter((g) => g.tier !== "main");
  const practiceOnly = games.filter((g) => !g.availableModes.includes("daily") && g.availableModes.includes("practice"));
  const announced = games.filter((g) => g.comingSoon);

  return (
    <div className="max-w-md sm:max-w-lg lg:max-w-2xl mx-auto px-5 sm:px-6 pt-3 pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Countrivo Geography Games",
            numberOfItems: games.length,
            itemListElement: games.map((g, i) => ({ "@type": "ListItem", position: i + 1, name: g.title, url: `https://countrivo.com${g.route}` })),
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
              { "@type": "Question", name: "What are the best free geography games online?", acceptedAnswer: { "@type": "Answer", text: `Countrivo has ${games.length} free geography games: daily one-shot puzzles such as Country Draft, GeoWordle, Higher or Lower and Cluster, plus flag, capital and border quizzes for practice. No signup is needed to play.` } },
              { "@type": "Question", name: "Do I need an account to play?", acceptedAnswer: { "@type": "Answer", text: "No. Every game is free and playable without an account. Sign in only if you want your daily shot on the global and friends boards." } },
              { "@type": "Question", name: "How do daily challenges work?", acceptedAnswer: { "@type": "Answer", text: `${dailies.length} games have a daily challenge: one shot per day, the same board for everyone, results on the board until midnight Berlin time. Practice mode is unlimited and never counts.` } },
            ],
          }),
        }}
      />

      <h1 className="font-display font-semibold text-[30px] leading-tight mt-2">All games</h1>
      <p className="mt-2 text-[14px] text-cream-muted">{dailies.length} dailies, one shot each. Everything is free to practice.</p>

      <section className="mt-7" aria-labelledby="dailies">
        <h2 id="dailies" className="flex justify-between text-xs text-cream-muted mb-1"><span>Daily puzzles</span><span>{mainDailies.length}</span></h2>
        {mainDailies.map((g) => <GameRow key={g.slug} game={g} meta={g.shortDescription} href={g.route} tag={g.isNew ? "NEW" : undefined} />)}
      </section>

      <section className="mt-7" aria-labelledby="drills">
        <h2 id="drills" className="flex justify-between text-xs text-cream-muted mb-1"><span>Daily drills</span><span>{drillDailies.length}</span></h2>
        {drillDailies.map((g) => <GameRow key={g.slug} game={g} meta={g.shortDescription} href={g.route} tag={g.isNew ? "NEW" : undefined} />)}
      </section>

      <section className="mt-7" aria-labelledby="practice">
        <h2 id="practice" className="flex justify-between text-xs text-cream-muted mb-1"><span>Practice only</span><span>{practiceOnly.length}</span></h2>
        {practiceOnly.map((g) => <GameRow key={g.slug} game={g} meta={g.shortDescription} href={g.route} tag={g.isNew ? "NEW" : undefined} />)}
      </section>

      {announced.length > 0 && (
        <section className="mt-7" aria-labelledby="soon">
          <h2 id="soon" className="flex justify-between text-xs text-cream-muted mb-1"><span>In development</span><span>{announced.length}</span></h2>
          {announced.map((g) => (
            <Link key={g.slug} href={g.route} className="flex items-center gap-3 py-3 border-t border-border -mx-2 px-2 rounded-md hover:bg-surface-elevated transition-colors">
              <span className="w-11 flex justify-center text-cream-muted shrink-0"><GameMark slug={g.slug} size={26} /></span>
              <span className="flex-1 min-w-0">
                <span className="block text-base leading-tight">{g.title}<em className="not-italic ml-1.5 text-[11px] font-bold text-gold-ink">SOON</em></span>
                <small className="block text-xs text-cream-muted truncate">{g.shortDescription}</small>
              </span>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
