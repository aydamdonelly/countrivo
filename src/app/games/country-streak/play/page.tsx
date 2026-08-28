import { GameShell } from "@/components/game/game-shell";
import { StreakBoard } from "@/components/games/country-streak/streak-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";
import { getDailyEdition } from "@/lib/daily-edition";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Country Streak · Play",
  robots: { index: false, follow: true },
};

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function CountryStreakPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";
  const edition = await getDailyEdition();

  return (
    <GameShell title="Country Streak" backHref="/games/country-streak" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="country-streak" gameEmoji="⚡" gameTitle="Country Streak" edition={edition}>
          <StreakBoard mode={gameMode} edition={edition} />
        </DailyLockoutGuard>
      ) : (
        <StreakBoard mode={gameMode} edition={edition} />
      )}
    </GameShell>
  );
}
