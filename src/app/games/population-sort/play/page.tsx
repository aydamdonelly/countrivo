import { GameShell } from "@/components/game/game-shell";
import { SortBoard } from "@/components/games/population-sort/sort-board";
import { DailyAlreadyPlayed } from "@/components/game/daily-already-played";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";
import { checkDailyStatus, getDailySummary } from "@/app/actions/game-runs";
import { getTodayDateKey } from "@/lib/daily-seed";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function PopulationSortPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";

  let alreadyPlayedRun = null;
  let totalPlayersToday = 0;

  if (gameMode === "daily") {
    const dateKey = getTodayDateKey();
    const status = await checkDailyStatus("population-sort", dateKey);
    if (status.played && status.run) {
      alreadyPlayedRun = status.run;
      const summary = await getDailySummary("population-sort", dateKey);
      totalPlayersToday = summary.playerCount;
    }
  }

  if (alreadyPlayedRun) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DailyAlreadyPlayed
          gameSlug="population-sort"
          gameEmoji="📊"
          gameTitle="Population Sort"
          run={alreadyPlayedRun}
          totalPlayersToday={totalPlayersToday}
        />
      </div>
    );
  }

  return (
    <GameShell title="Population Sort" backHref="/games/population-sort" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="population-sort" gameEmoji="📊" gameTitle="Population Sort">
          <SortBoard mode={gameMode} />
        </DailyLockoutGuard>
      ) : (
        <SortBoard mode={gameMode} />
      )}
    </GameShell>
  );
}
