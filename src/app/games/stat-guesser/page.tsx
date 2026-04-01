import { GameLanding } from "@/components/game/game-landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stat Guesser — Guess Country Statistics",
  description: "What's the population of Brazil? The GDP of Norway? Guess the exact number — closer is better. Free daily geography trivia challenge.",
  alternates: { canonical: "https://countrivo.com/games/stat-guesser" },
};

export default function StatGuesserPage() {
  return (
    <GameLanding
      emoji="📊"
      title="Stat Guesser"
      description="A country and a stat appear — guess the value. The closer you are, the better your score."
      playHref="/games/stat-guesser/play"
      rules={[
        "A country and stat category are shown",
        "Enter your best guess for the value",
        "Score is based on percentage error",
        "5 rounds per game — lowest average error wins",
      ]}
    />
  );
}
