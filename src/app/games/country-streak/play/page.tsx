import { GameShell } from "@/components/game/game-shell";
import { StreakBoard } from "@/components/games/country-streak/streak-board";
import { DailyAlreadyPlayed } from "@/components/game/daily-already-played";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";
import { checkDailyStatus, getDailySummary } from "@/app/actions/game-runs";
import { getTodayDateKey } from "@/lib/daily-seed";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function CountryStreakPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";

  let alreadyPlayedRun = null;
  let totalPlayersToday = 0;

  if (gameMode === "daily") {
    const dateKey = getTodayDateKey();
    const status = await checkDailyStatus("country-streak", dateKey);
    if (status.played && status.run) {
      alreadyPlayedRun = status.run;
      const summary = await getDailySummary("country-streak", dateKey);
      totalPlayersToday = summary.playerCount;
    }
  }

  if (alreadyPlayedRun) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DailyAlreadyPlayed
          gameSlug="country-streak"
          gameEmoji="🔥"
          gameTitle="Country Streak"
          run={alreadyPlayedRun}
          totalPlayersToday={totalPlayersToday}
        />
      </div>
    );
  }

  return (
    <GameShell title="Country Streak" backHref="/games/country-streak" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="country-streak" gameEmoji="⚡" gameTitle="Country Streak">
          <StreakBoard mode={gameMode} />
        </DailyLockoutGuard>
      ) : (
        <StreakBoard mode={gameMode} />
      )}
    </GameShell>
  );
}
