import { GameLanding } from "@/components/game/game-landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Speed Flags — Fast Flag Quiz Against the Clock",
  description: "20 seconds. How many flags can you correctly identify? Fast-paced flag quiz where speed and accuracy both count. Free online geography game.",
  alternates: { canonical: "https://countrivo.com/games/speed-flags" },
};

export default function SpeedFlagsPage() {
  return (
    <GameLanding
      emoji="⚡"
      title="Speed Flags"
      description="20 seconds on the clock. A flag and two names — pick the right one. How many can you get?"
      playHref="/games/speed-flags/play"
      hasDailyMode={false}
      rules={[
        "A flag is shown with 2 country options",
        "Pick the correct country as fast as you can",
        "20-second countdown timer",
        "Score: total correct answers",
      ]}
    />
  );
}
