import { GameShell } from "@/components/game/game-shell";
import { RiskBoard } from "@/components/games/risk-zone/risk-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";
import { getDailyEdition } from "@/lib/daily-edition";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Risk Zone · Play",
  robots: { index: false, follow: true },
};

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function RiskZonePlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";
  const edition = await getDailyEdition();

  return (
    <GameShell title="Risk Zone" backHref="/games/risk-zone" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="risk-zone" gameEmoji="🎲" gameTitle="Risk Zone" edition={edition}>
          <RiskBoard mode={gameMode} edition={edition} />
        </DailyLockoutGuard>
      ) : (
        <RiskBoard mode={gameMode} edition={edition} />
      )}
    </GameShell>
  );
}
