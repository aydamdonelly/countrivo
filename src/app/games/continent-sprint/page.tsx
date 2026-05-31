import { GameLanding } from "@/components/game/game-landing";
import { GameJsonLd } from "@/components/seo/game-jsonld";
import { buildGameMetadata, buildGameJsonLd } from "@/lib/seo/game-metadata";

export const metadata = buildGameMetadata("continent-sprint");

export default function ContinentSprintPage() {
  return (
    <>
      <GameJsonLd {...buildGameJsonLd("continent-sprint")} />
      <GameLanding
      emoji="🏃"
      title="Continent Sprint"
      description="Pick a continent and name every country in it. How fast can you go?"
      playHref="/games/continent-sprint/play"
      hasDailyMode={false}
      rules={[
        "Choose a continent to start",
        "Type country names as fast as you can",
        "Timer counts up. No time limit",
        "Finish when you've found them all or give up",
      ]}
      />
    </>
  );
}
