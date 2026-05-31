import { GameLanding } from "@/components/game/game-landing";
import { GameJsonLd } from "@/components/seo/game-jsonld";
import { buildGameMetadata, buildGameJsonLd } from "@/lib/seo/game-metadata";

export const metadata = buildGameMetadata("population-sort");

export default function PopulationSortPage() {
  return (
    <>
      <GameJsonLd {...buildGameJsonLd("population-sort")} />
      <GameLanding
      emoji="📊"
      title="Population Sort"
      description="Sort countries from highest to lowest for a given stat. Test your world ranking knowledge."
      playHref="/games/population-sort/play"
      rules={[
        "6 countries are shown in random order",
        "A stat category is given (e.g., Population, GDP)",
        "Rearrange countries from highest to lowest",
        "Submit when you're confident in your order",
      ]}
      />
    </>
  );
}
