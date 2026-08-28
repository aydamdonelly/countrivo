import { GameShell } from "@/components/game/game-shell";
import { CapitalBoard } from "@/components/games/capital-match/capital-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";
import { getDailyEdition } from "@/lib/daily-edition";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Capital Match · Play",
  robots: { index: false, follow: true },
};

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function CapitalMatchPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";
  const edition = await getDailyEdition();

  return (
    <GameShell title="Capital Match" backHref="/games/capital-match" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="capital-match" gameEmoji="📍" gameTitle="Capital Match" edition={edition}>
          <CapitalBoard mode={gameMode} edition={edition} />
        </DailyLockoutGuard>
      ) : (
        <CapitalBoard mode={gameMode} edition={edition} />
      )}
    </GameShell>
  );
}
