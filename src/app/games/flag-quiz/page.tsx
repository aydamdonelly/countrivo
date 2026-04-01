import { GameLanding } from "@/components/game/game-landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flag Quiz — Identify Countries by Their Flags",
  description: "Can you name every country from its flag? Free flag quiz game with daily challenges and unlimited practice. 243 countries, no signup.",
  alternates: { canonical: "https://countrivo.com/games/flag-quiz" },
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
