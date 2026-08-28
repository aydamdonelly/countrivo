import type { Metadata } from "next";
import { getAllGames } from "@/lib/data/games";
import { getHomeData } from "@/app/actions/home";
import { HomeClient } from "@/components/home/home-client";
import { GameCard } from "@/components/home/game-card";
import { DailyList, PracticeList, PracticeHero } from "@/components/home/game-list";
import { ResetLabel } from "@/components/home/reset-label";

export const metadata: Metadata = {
  title: "Countrivo: Daily Geography Games, Country Draft, Flag Quiz & GeoWordle",
  description:
    "One shot a day, the same board for everyone. Country Draft, GeoWordle, Higher or Lower, flag and capital quizzes. Free, no signup, 243 countries.",
  alternates: { canonical: "https://countrivo.com" },
};

// The board is live data (today's shots), never a static snapshot.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const all = getAllGames();
  const data = await getHomeData();

  // Carousel: the main daily games (flagship first) plus the World Draft preview.
  const mainDaily = all.filter((g) => g.tier === "main" && g.availableModes.includes("daily"));
  const carouselGames = [...mainDaily.filter((g) => g.isFlagship), ...mainDaily.filter((g) => !g.isFlagship)];
  const worldDraft = all.find((g) => g.slug === "world-draft");
  const cardGames = worldDraft ? [...carouselGames, worldDraft] : carouselGames;

  // "More dailies": every other daily game.
  const carouselSet = new Set(cardGames.map((g) => g.slug));
  const moreDailies = all.filter((g) => g.availableModes.includes("daily") && !carouselSet.has(g.slug));
  const practiceGames = all.filter((g) => g.availableModes.includes("practice"));

  return (
    <div className="max-w-md sm:max-w-lg lg:max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 pt-3 pb-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Countrivo Geography Games",
            numberOfItems: all.length,
            itemListElement: all.map((g, i) => ({ "@type": "ListItem", position: i + 1, name: g.title, url: `https://countrivo.com${g.route}` })),
          }),
        }}
      />

      <h1 className="sr-only">Countrivo: daily geography games</h1>

      <div className="flex items-center justify-between mb-4 lg:hidden">
        <span className="text-xs text-cream-muted">{new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Berlin" })}</span>
        <ResetLabel />
      </div>

      <div>
        <HomeClient
          slugs={cardGames.map((g) => g.slug)}
          titles={cardGames.map((g) => g.title)}
          cards={cardGames.map((g) => (
            <GameCard
              key={g.slug}
              game={g}
              board={data.boards[g.slug]}
              categories={g.slug === "country-draft" ? data.draftCategories : undefined}
              comingSoon={g.slug === "world-draft"}
            />
          ))}
          boards={data.boards}
          signedIn={data.signedIn}
          friendCount={data.friendCount}
          dailyList={<DailyList games={moreDailies} boards={data.boards} />}
          practiceHero={<PracticeHero game={cardGames[0]} />}
          practiceList={<PracticeList games={practiceGames} />}
        />
      </div>
    </div>
  );
}
