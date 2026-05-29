import { CaravanBoard } from "@/components/games/caravan/caravan-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";
import { GameShell } from "@/components/game/game-shell";
import { getDailyEdition } from "@/lib/daily-edition";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function CaravanPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";
  const edition = await getDailyEdition();

  return (
    <GameShell title="Caravan" backHref="/games/caravan" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="caravan" gameEmoji="🐪" gameTitle="Caravan" edition={edition}>
          <CaravanBoard mode={gameMode} edition={edition} />
        </DailyLockoutGuard>
      ) : (
        <CaravanBoard mode={gameMode} edition={edition} />
      )}
    </GameShell>
  );
}
