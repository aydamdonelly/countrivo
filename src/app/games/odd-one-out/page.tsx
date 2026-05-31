import { GameLanding } from "@/components/game/game-landing";
import { GameJsonLd } from "@/components/seo/game-jsonld";
import { buildGameMetadata, buildGameJsonLd } from "@/lib/seo/game-metadata";

export const metadata = buildGameMetadata("odd-one-out");

export default function OddOneOutPage() {
  return (
    <>
      <GameJsonLd {...buildGameJsonLd("odd-one-out")} />
      <GameLanding
      emoji="🔍"
      title="Odd One Out"
      description="Four countries are shown. Three share a trait, one doesn't. Can you spot the odd one out?"
      playHref="/games/odd-one-out/play"
      rules={[
        "Four countries are displayed with their flags",
        "Three share a common trait (continent, region, first letter, etc.)",
        "Pick the one that doesn't belong",
        "5 rounds per game",
      ]}
      />
    </>
  );
}
