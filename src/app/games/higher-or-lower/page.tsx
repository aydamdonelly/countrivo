import { GameLanding } from "@/components/game/game-landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Higher or Lower — Countrivo",
  description: "Two countries, one stat. Pick which is higher. Keep your streak alive.",
};

export default function HigherOrLowerPage() {
  return (
    <GameLanding
      emoji="⬆️"
      title="Higher or Lower"
      description="Two countries, one stat. Pick which is higher. Keep your streak alive as long as possible."
      playHref="/games/higher-or-lower/play"
      rules={[
        "Two countries are shown with a stat category",
        "The left country's value is revealed",
        "Guess if the right country is higher or lower",
        "One wrong answer ends the streak",
      ]}
    />
  );
}
