import { GameLanding } from "@/components/game/game-landing";
import { PlayedTodayBanner } from "@/components/game/played-today-banner";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Caravan | Build the Richest Country Caravan",
  description: "One budget, five countries. Spend your gold to build the most valuable caravan and beat the optimal basket. A daily geography optimization puzzle. No signup.",
  alternates: { canonical: "https://countrivo.com/games/caravan" },
};

export default function CaravanPage() {
  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <PlayedTodayBanner gameSlug="caravan" playHref="/games/caravan/play" />
      </div>
      <GameLanding
        emoji="🐪"
        title="Caravan"
        description="One budget. Twelve countries, each with a price and a value set by a single metric. Buy exactly five and build the most valuable caravan your gold can afford — then see how close you got to the perfect basket."
        playHref="/games/caravan/play"
        rules={[
          "One metric sets each country's value — higher rank, more points",
          "Every country has a price; you have a fixed gold budget",
          "Buy exactly 5, one at a time — premiums cost much more",
          "Score: how close your caravan's value gets to the optimal 5",
        ]}
      />
    </>
  );
}
