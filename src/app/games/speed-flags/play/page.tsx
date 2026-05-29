import { GameShell } from "@/components/game/game-shell";
import { SpeedBoard } from "@/components/games/speed-flags/speed-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";
import { getDailyEdition } from "@/lib/daily-edition";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function SpeedFlagsPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";
  const edition = await getDailyEdition();

  return (
    <GameShell title="Speed Flags" backHref="/games/speed-flags" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="speed-flags" gameEmoji="⏱️" gameTitle="Speed Flags" edition={edition}>
          <SpeedBoard mode={gameMode} edition={edition} />
        </DailyLockoutGuard>
      ) : (
        <SpeedBoard mode={gameMode} edition={edition} />
      )}
    </GameShell>
  );
}
