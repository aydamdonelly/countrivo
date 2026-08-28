import { GameLanding } from "@/components/game/game-landing";
import { GameJsonLd } from "@/components/seo/game-jsonld";
import { buildGameMetadata, buildGameJsonLd } from "@/lib/seo/game-metadata";

export const metadata = buildGameMetadata("geo-wordle");

export default function GeoWordlePage() {
  return (
    <>
      <GameJsonLd {...buildGameJsonLd("geo-wordle")} />
      <GameLanding
        emoji="🌍"
        title="GeoWordle"
        description="A mystery country is hidden each day. Each guess reveals how far away you are and which direction to head. Solve it in six tries."
        playHref="/games/geo-wordle/play"
        rules={[
          "A mystery country is hidden each day",
          "Type a country to make a guess",
          "Each guess shows the distance and a direction arrow to the answer",
          "Narrow it down and solve it in six guesses or fewer",
        ]}
      />
    </>
  );
}
