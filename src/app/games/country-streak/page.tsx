import { GameLanding } from "@/components/game/game-landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Country Streak — Flag Identification Streak Game",
  description: "How long can you streak? Identify countries from flags — one wrong answer ends it. Free flag quiz with daily challenges.",
  alternates: { canonical: "https://countrivo.com/games/country-streak" },
};

export default function CountryStreakPage() {
  return (
    <GameLanding
      emoji="🔥"
      title="Country Streak"
      description="Identify countries from their flags. One wrong answer ends the streak. How far can you go?"
      playHref="/games/country-streak/play"
      rules={[
        "A flag is shown on screen",
        "Pick the correct country from 4 options",
        "Correct answers extend your streak",
        "One wrong answer = game over",
      ]}
    />
  );
}
