import { GameLanding } from "@/components/game/game-landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Population Sort — Countrivo",
  description: "Sort countries by a statistic. How well do you know world rankings?",
};

export default function PopulationSortPage() {
  return (
    <GameLanding
      emoji="📊"
      title="Population Sort"
      description="Sort countries from highest to lowest for a given stat. Test your world ranking knowledge."
      playHref="/games/population-sort/play"
      rules={[
        "6 countries are shown in random order",
        "A stat category is given (e.g., Population, GDP)",
        "Rearrange countries from highest to lowest",
        "Submit when you're confident in your order",
      ]}
    />
  );
}
