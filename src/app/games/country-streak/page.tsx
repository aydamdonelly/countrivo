import { GameLanding } from "@/components/game/game-landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Country Streak — Countrivo",
  description: "Identify countries from their flags. One wrong answer and it's game over.",
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
