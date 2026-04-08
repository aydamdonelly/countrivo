import { GameShell } from "@/components/game/game-shell";
import { OddBoard } from "@/components/games/odd-one-out/odd-board";
import { DailyAlreadyPlayed } from "@/components/game/daily-already-played";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";
import { checkDailyStatus, getDailySummary } from "@/app/actions/game-runs";
import { getTodayDateKey } from "@/lib/daily-seed";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function OddOneOutPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";

  let alreadyPlayedRun = null;
  let totalPlayersToday = 0;

  if (gameMode === "daily") {
    const dateKey = getTodayDateKey();
    const [status, summary] = await Promise.all([
      checkDailyStatus("odd-one-out", dateKey),
      getDailySummary("odd-one-out", dateKey),
    ]);
    if (status.played && status.run) alreadyPlayedRun = status.run;
    totalPlayersToday = summary.playerCount;
  }

  if (alreadyPlayedRun) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DailyAlreadyPlayed
          gameSlug="odd-one-out"
          gameEmoji="🔍"
          gameTitle="Odd One Out"
          run={alreadyPlayedRun}
          totalPlayersToday={totalPlayersToday}
        />
      </div>
    );
  }

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
