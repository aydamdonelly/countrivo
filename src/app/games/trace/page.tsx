import { GameLanding } from "@/components/game/game-landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trace | Guess the Country from Stat Clues",
  description: "Trace the hidden country in 6 guesses. Each guess reveals whether the target is higher or lower across 6 stat categories. A daily geography puzzle.",
  alternates: { canonical: "https://countrivo.com/games/trace" },
};

export default function TracePage() {
  return (
    <GameLanding
      emoji="🌍"
      title="Trace"
      description="Six guesses, six stat clues, one country. Trace the hidden country through population, area, GDP, and three more stat axes — each guess reveals direction."
      playHref="/games/trace/play"
      showDateStamp
      rules={[
        "A hidden country is chosen. You have 6 guesses.",
        "Each guess reveals whether the target is higher or lower in 6 categories.",
        "Use population, area, GDP, life expectancy, internet, and fertility rate as clues.",
      ]}
    />
  );
}
