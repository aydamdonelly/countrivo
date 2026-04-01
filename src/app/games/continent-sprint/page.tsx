import { GameLanding } from "@/components/game/game-landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Continent Sprint — Name Every Country in a Continent",
  description: "Pick a continent and name every country in it against the clock. Europe, Asia, Africa, Americas — how many can you get? Free geography game.",
  alternates: { canonical: "https://countrivo.com/games/continent-sprint" },
};

export default function ContinentSprintPage() {
  return (
    <GameLanding
      emoji="🏃"
      title="Continent Sprint"
      description="Pick a continent and name every country in it. How fast can you go?"
      playHref="/games/continent-sprint/play"
      hasDailyMode={false}
      rules={[
        "Choose a continent to start",
        "Type country names as fast as you can",
        "Timer counts up — no time limit",
        "Finish when you've found them all or give up",
      ]}
    />
  );
}
