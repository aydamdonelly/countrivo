import { GameLanding } from "@/components/game/game-landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Speed Flags — Countrivo",
  description: "Identify as many flags as possible in 60 seconds. A fast-paced flag challenge.",
};

export default function SpeedFlagsPage() {
  return (
    <GameLanding
      emoji="⚡"
      title="Speed Flags"
      description="60 seconds on the clock. A flag and two names — pick the right one. How many can you get?"
      playHref="/games/speed-flags/play"
      hasDailyMode={false}
      rules={[
        "A flag is shown with 2 country options",
        "Pick the correct country as fast as you can",
        "60-second countdown timer",
        "Score: total correct answers",
      ]}
    />
  );
}
