import { GameLanding } from "@/components/game/game-landing";
import { buildGameMetadata } from "@/lib/seo/game-metadata";

export const metadata = buildGameMetadata("supremacy");

export default function Page() {
  return (
    <GameLanding
      title="Supremacy"
      description="Draft a hand of countries and play them against an opponent, one hidden stat at a time."
      playHref="/games/supremacy/play"
      hasDailyMode={false}
      rules={[
        "You and your opponent each hold a hand of country cards",
        "Each round a stat category is revealed",
        "Pick the country you think ranks higher on it",
        "Five rounds; most rounds won takes the match",
      ]}
      relatedGames={[
          { href: "/games/country-draft", name: "Country Draft" },
          { href: "/games/higher-or-lower", name: "Higher or Lower" },
          { href: "/games/stat-guesser", name: "Stat Guesser" },
          { href: "/games/risk-zone", name: "Risk Zone" },
      ]}
    />
  );
}
