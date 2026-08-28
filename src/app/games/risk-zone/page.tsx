import { GameLanding } from "@/components/game/game-landing";
import { GameJsonLd } from "@/components/seo/game-jsonld";
import { buildGameMetadata, buildGameJsonLd } from "@/lib/seo/game-metadata";

export const metadata = buildGameMetadata("risk-zone");

export default function RiskZonePage() {
  return (
    <>
      <GameJsonLd {...buildGameJsonLd("risk-zone")} />
      <GameLanding
        emoji="🎲"
        title="Risk Zone"
        description="Guess higher or lower one country at a time. Each correct call grows your multiplier, bank the pot or gamble one more reveal. One wrong answer wipes the chain."
        playHref="/games/risk-zone/play"
        rules={[
          "A country's stat value is shown, guess if the next is higher or lower",
          "Each correct guess grows your multiplier and your pot",
          "Bank the pot to lock the points, or push your luck for one more reveal",
          "One wrong guess wipes the chain, play 5 chains for the highest total",
        ]}
      />
    </>
  );
}
