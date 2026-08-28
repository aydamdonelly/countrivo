import { GameLanding } from "@/components/game/game-landing";
import { buildGameMetadata } from "@/lib/seo/game-metadata";

export const metadata = buildGameMetadata("borderline");

export default function Page() {
  return (
    <GameLanding
      title="Borderline"
      description="Start in one country and reach the target by crossing only land borders, in as few steps as possible."
      playHref="/games/borderline/play"
      hasDailyMode={false}
      rules={[
        "Two countries are shown: where you start and where you need to get to",
        "Pick a neighbouring country to cross one border",
        "Keep crossing until you reach the target",
        "Fewer borders crossed means a better score",
      ]}
      relatedGames={[
          { href: "/games/border-buddies", name: "Border Buddies" },
          { href: "/games/odd-one-out", name: "Odd One Out" },
          { href: "/games/geo-wordle", name: "GeoWordle" },
          { href: "/games/country-draft", name: "Country Draft" },
      ]}
    />
  );
}
