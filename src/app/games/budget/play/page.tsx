import { BudgetBoard } from "@/components/games/budget/budget-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";
import { GameShell } from "@/components/game/game-shell";
import { getDailyEdition } from "@/lib/daily-edition";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function BudgetPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";
  const edition = await getDailyEdition();

  return (
    <GameShell title="Budget" backHref="/games/budget" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="budget" gameEmoji="🪙" gameTitle="Budget" edition={edition}>
          <BudgetBoard mode={gameMode} edition={edition} />
        </DailyLockoutGuard>
      ) : (
        <BudgetBoard mode={gameMode} edition={edition} />
      )}
    </GameShell>
  );
}
