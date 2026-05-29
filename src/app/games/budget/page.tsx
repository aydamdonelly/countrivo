import { GameLanding } from "@/components/game/game-landing";
import { PlayedTodayBanner } from "@/components/game/played-today-banner";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Budget | Split the World by the Numbers",
  description: "Five countries share one real-world total. Spend 100 tokens to estimate each country's share. A daily geography estimation puzzle. No signup.",
  alternates: { canonical: "https://countrivo.com/games/budget" },
};

export default function BudgetPage() {
  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <PlayedTodayBanner gameSlug="budget" playHref="/games/budget/play" />
      </div>
      <GameLanding
        emoji="🪙"
        title="Budget"
        description="Five countries share one real-world total — population, GDP, tourists, and more. You get 100 tokens. Spend them to estimate each country's share of the whole, then reveal how the world actually splits."
        playHref="/games/budget/play"
        rules={[
          "Five countries share a single real total",
          "Spend all 100 tokens across them by estimated share",
          "More tokens on a country = you think it holds a bigger slice",
          "Score: how much you beat a blind even split (0–100)",
        ]}
      />
    </>
  );
}
