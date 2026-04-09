import { GameShell } from "@/components/game/game-shell";
import { StreakBoard } from "@/components/games/country-streak/streak-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function CountryStreakPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";

  return (
    <GameShell title="Country Streak" backHref="/games/country-streak" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="country-streak" gameEmoji="⚡" gameTitle="Country Streak">
          <StreakBoard mode={gameMode} />
        </DailyLockoutGuard>
      ) : (
        <StreakBoard mode={gameMode} />
      )}
    </GameShell>
  );
}
