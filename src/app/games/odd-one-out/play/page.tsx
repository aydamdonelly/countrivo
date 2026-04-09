import { GameShell } from "@/components/game/game-shell";
import { OddBoard } from "@/components/games/odd-one-out/odd-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function OddOneOutPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";

  return (
    <GameShell title="Odd One Out" backHref="/games/odd-one-out" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="odd-one-out" gameEmoji="🔍" gameTitle="Odd One Out">
          <OddBoard mode={gameMode} />
        </DailyLockoutGuard>
      ) : (
        <OddBoard mode={gameMode} />
      )}
    </GameShell>
  );
}
