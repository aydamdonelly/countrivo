import { GameLanding } from "@/components/game/game-landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Odd One Out — Countrivo",
  description: "Four countries, one doesn't belong. Can you spot the odd one out?",
};

export default function OddOneOutPage() {
  return (
    <GameLanding
      emoji="🔍"
      title="Odd One Out"
      description="Four countries are shown — three share a trait, one doesn't. Can you spot the odd one out?"
      playHref="/games/odd-one-out/play"
      rules={[
        "Four countries are displayed with their flags",
        "Three share a common trait (continent, region, first letter, etc.)",
        "Pick the one that doesn't belong",
        "5 rounds per game",
      ]}
    />
  );
}
