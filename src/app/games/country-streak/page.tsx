import { GameLanding } from "@/components/game/game-landing";
import { GameJsonLd } from "@/components/seo/game-jsonld";
import { buildGameMetadata, buildGameJsonLd } from "@/lib/seo/game-metadata";

export const metadata = buildGameMetadata("country-streak");

export default function CountryStreakPage() {
  return (
    <>
      <GameJsonLd {...buildGameJsonLd("country-streak")} />
      <GameLanding
      emoji="🔥"
      title="Country Streak"
      description="Identify countries from their flags. One wrong answer ends the streak. How far can you go?"
      playHref="/games/country-streak/play"
      rules={[
        "A flag is shown on screen",
        "Pick the correct country from 4 options",
        "Correct answers extend your streak",
        "One wrong answer = game over",
      ]}
      />
    </>
  );
}
