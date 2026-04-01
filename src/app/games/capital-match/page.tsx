import { GameLanding } from "@/components/game/game-landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Capital Match | Test Your World Capitals Knowledge",
  description: "Test your world capitals knowledge. Given a country, pick its capital from 4 options. Free daily challenge. 243 countries, no account needed.",
  alternates: { canonical: "https://countrivo.com/games/capital-match" },
};

export default function CapitalMatchPage() {
  return (
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
  );
}
