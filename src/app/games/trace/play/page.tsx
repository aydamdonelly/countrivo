import { GameShell } from "@/components/game/game-shell";
import { TraceBoard } from "@/components/games/trace/trace-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function TracePlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";

  return (
    <GameShell title="Trace" backHref="/games/trace" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="trace" gameEmoji="🌍" gameTitle="Trace">
          <TraceBoard mode={gameMode} />
        </DailyLockoutGuard>
      ) : (
        <TraceBoard mode={gameMode} />
      )}
    </GameShell>
  );
}
