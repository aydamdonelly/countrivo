import { GameShell } from "@/components/game/game-shell";
import { SortBoard } from "@/components/games/population-sort/sort-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function PopulationSortPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";

  return (
    <GameShell title="Population Sort" backHref="/games/population-sort" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="population-sort" gameEmoji="📊" gameTitle="Population Sort">
          <SortBoard mode={gameMode} />
        </DailyLockoutGuard>
      ) : (
        <SortBoard mode={gameMode} />
      )}
    </GameShell>
  );
}
