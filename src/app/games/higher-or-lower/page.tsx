import { GameLanding } from "@/components/game/game-landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Higher or Lower — Country Stat Ranking Game",
  description: "Which country ranks higher in population, GDP, or tourism? Daily streak game with unlimited practice. Free geography quiz online.",
  alternates: { canonical: "https://countrivo.com/games/higher-or-lower" },
};

export default function HigherOrLowerPage() {
  return (
    <GameLanding
      emoji="⬆️"
      title="Higher or Lower"
      description="Two countries, one stat. Pick which is higher. Keep your streak alive as long as possible."
      playHref="/games/higher-or-lower/play"
      rules={[
        "Two countries are shown with a stat category",
        "The left country's value is revealed",
        "Guess if the right country is higher or lower",
        "One wrong answer ends the streak",
      ]}
    />
  );
}
