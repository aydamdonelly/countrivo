import { GameShell } from "@/components/game/game-shell";
import { OddBoard } from "@/components/games/odd-one-out/odd-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";
import { getDailyEdition } from "@/lib/daily-edition";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function OddOneOutPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";
  const edition = await getDailyEdition();

  return (
    <GameShell title="Odd One Out" backHref="/games/odd-one-out" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="odd-one-out" gameEmoji="🔍" gameTitle="Odd One Out" edition={edition}>
          <OddBoard mode={gameMode} edition={edition} />
        </DailyLockoutGuard>
      ) : (
        <OddBoard mode={gameMode} edition={edition} />
      )}
    </GameShell>
  );
}
