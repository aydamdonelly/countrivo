import { GameLanding } from "@/components/game/game-landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Countryle | Guess the Country from Stat Clues",
  description: "Guess the hidden country in 6 tries. Each guess reveals whether the target is higher or lower across 6 stat categories. A daily geography puzzle.",
  alternates: { canonical: "https://countrivo.com/games/countryle" },
};

export default function CountrylePage() {
  return (
    <GameLanding
      emoji="🌍"
      title="Countryle"
      description="A hidden country is chosen. Guess it in 6 tries. Each guess reveals how the target compares across 6 stats."
      playHref="/games/countryle/play"
      rules={[
        "A hidden country is chosen. You have 6 guesses.",
        "Each guess reveals whether the target is higher or lower in 6 categories.",
        "Use population, area, GDP, life expectancy, internet, and fertility rate as clues.",
      ]}
    />
  );
}
