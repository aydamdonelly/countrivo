import { GameShell } from "@/components/game/game-shell";
import { SortBoard } from "@/components/games/population-sort/sort-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";
import { getDailyEdition } from "@/lib/daily-edition";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function PopulationSortPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";
  const edition = await getDailyEdition();

  return (
    <GameShell title="Population Sort" backHref="/games/population-sort" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="population-sort" gameEmoji="📊" gameTitle="Population Sort" edition={edition}>
          <SortBoard mode={gameMode} edition={edition} />
        </DailyLockoutGuard>
      ) : (
        <SortBoard mode={gameMode} edition={edition} />
      )}
    </GameShell>
  );
}
