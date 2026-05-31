import { GameLanding } from "@/components/game/game-landing";
import { GameJsonLd } from "@/components/seo/game-jsonld";
import { buildGameMetadata, buildGameJsonLd } from "@/lib/seo/game-metadata";

export const metadata = buildGameMetadata("stat-guesser");

export default function StatGuesserPage() {
  return (
    <>
      <GameJsonLd {...buildGameJsonLd("stat-guesser")} />
      <GameLanding
      emoji="📊"
      title="Stat Guesser"
      description="A country and a stat appear. Guess the value. The closer you are, the better your score."
      playHref="/games/stat-guesser/play"
      showDateStamp
      rules={[
        "A country and stat category are shown",
        "Enter your best guess for the value",
        "Score is based on percentage error",
        "5 rounds per game. Lowest average error wins",
      ]}
      />
    </>
  );
}
