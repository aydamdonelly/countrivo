import { GameLanding } from "@/components/game/game-landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flag Quiz — Countrivo",
  description: "Identify countries by their flags. Test your vexillology knowledge.",
};

export default function FlagQuizPage() {
  return (
    <GameLanding
      emoji="🏁"
      title="Flag Quiz"
      description="A flag appears — can you name the country? Test your vexillology knowledge across all nations."
      playHref="/games/flag-quiz/play"
      rules={[
        "A flag is shown on screen",
        "Pick the correct country from 4 options",
        "10 questions per round",
        "Score: correct answers out of 10",
      ]}
    />
  );
}
