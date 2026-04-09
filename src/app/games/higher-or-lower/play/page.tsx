import { GameShell } from "@/components/game/game-shell";
import { HoLBoard } from "@/components/games/higher-or-lower/hol-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function HoLPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";

  return (
    <GameShell title="Higher or Lower" backHref="/games/higher-or-lower" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="higher-or-lower" gameEmoji="⬆️" gameTitle="Higher or Lower">
          <HoLBoard mode={gameMode} />
        </DailyLockoutGuard>
      ) : (
        <HoLBoard mode={gameMode} />
      )}
    </GameShell>
  );
}
