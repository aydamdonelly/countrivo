import { GameLanding } from "@/components/game/game-landing";
import { PlayedTodayBanner } from "@/components/game/played-today-banner";
import { buildGameMetadata } from "@/lib/seo/game-metadata";

export const metadata = buildGameMetadata("country-draft");

export default function CountryDraftPage() {
  return (
    <>
      <div className="max-w-md sm:max-w-lg lg:max-w-2xl mx-auto px-5 sm:px-6 pt-4">
        <PlayedTodayBanner gameSlug="country-draft" playHref="/games/country-draft/play" />
      </div>
      <GameLanding
        title="Country Draft"
        description="Eight stats on the board. Countries appear one at a time; put each on the stat where it ranks highest in the world. Eight picks, one shot, scored against the optimal draft."
        playHref="/games/country-draft/play"
        showDateStamp
        category="strategy"
        rules={[
          "Eight stat categories are shown up front",
          "Countries are revealed one by one, so you never know what is still to come",
          "Assign each country to the open stat where it ranks best",
          "Your total is compared with the mathematically optimal assignment",
        ]}
        relatedGames={[
          { href: "/games/world-draft", name: "World Draft" },
          { href: "/games/higher-or-lower", name: "Higher or Lower" },
          { href: "/games/stat-guesser", name: "Stat Guesser" },
          { href: "/games/cluster", name: "Cluster" },
        ]}
      />
    </>
  );
}
