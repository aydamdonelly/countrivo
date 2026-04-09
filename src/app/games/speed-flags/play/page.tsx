import { GameShell } from "@/components/game/game-shell";
import { SpeedBoard } from "@/components/games/speed-flags/speed-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function SpeedFlagsPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";

  return (
    <GameShell title="Speed Flags" backHref="/games/speed-flags" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="speed-flags" gameEmoji="⏱️" gameTitle="Speed Flags">
          <SpeedBoard mode={gameMode} />
        </DailyLockoutGuard>
      ) : (
        <SpeedBoard mode={gameMode} />
      )}
    </GameShell>
  );
}
