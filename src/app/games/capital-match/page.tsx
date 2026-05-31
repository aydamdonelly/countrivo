import { GameLanding } from "@/components/game/game-landing";
import { GameJsonLd } from "@/components/seo/game-jsonld";
import { buildGameMetadata, buildGameJsonLd } from "@/lib/seo/game-metadata";

export const metadata = buildGameMetadata("capital-match");

export default function CapitalMatchPage() {
  return (
    <>
      <GameJsonLd {...buildGameJsonLd("capital-match")} />
      <GameLanding
      emoji="🏛️"
      title="Capital Match"
      description="Given a country, pick the correct capital from four options. How well do you know world capitals?"
      playHref="/games/capital-match/play"
      rules={[
        "A country is shown with its flag",
        "Pick the correct capital from 4 options",
        "10 questions per round",
        "Score: correct answers out of 10",
      ]}
      />
    </>
  );
}
