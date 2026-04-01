import { GameLanding } from "@/components/game/game-landing";
import { PlayedTodayBanner } from "@/components/game/played-today-banner";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flag Quiz | Guess the Country from Its Flag",
  description: "Can you name every country from its flag? Free flag quiz game with daily challenges and unlimited practice. 243 countries, no signup.",
  alternates: { canonical: "https://countrivo.com/games/flag-quiz" },
};

export default function FlagQuizPage() {
  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <PlayedTodayBanner gameSlug="flag-quiz" playHref="/games/flag-quiz/play" />
      </div>
      <GameLanding
        emoji="🏁"
        title="Flag Quiz"
        description="A flag appears. Can you name the country? Test your vexillology knowledge across all nations."
        playHref="/games/flag-quiz/play"
        rules={[
          "A flag is shown on screen",
          "Pick the correct country from 4 options",
          "10 questions per round",
          "Score: correct answers out of 10",
        ]}
      />
    </>
  );
}
