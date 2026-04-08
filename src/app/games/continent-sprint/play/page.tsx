import { GameShell } from "@/components/game/game-shell";
import { SprintBoard } from "@/components/games/continent-sprint/sprint-board";
import { DailyAlreadyPlayed } from "@/components/game/daily-already-played";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";
import { checkDailyStatus, getDailySummary } from "@/app/actions/game-runs";
import { getTodayDateKey } from "@/lib/daily-seed";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function ContinentSprintPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";

  let alreadyPlayedRun = null;
  let totalPlayersToday = 0;

  if (gameMode === "daily") {
    const dateKey = getTodayDateKey();
    const status = await checkDailyStatus("continent-sprint", dateKey);
    if (status.played && status.run) {
      alreadyPlayedRun = status.run;
      const summary = await getDailySummary("continent-sprint", dateKey);
      totalPlayersToday = summary.playerCount;
    }
  }

  if (alreadyPlayedRun) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DailyAlreadyPlayed
          gameSlug="continent-sprint"
          gameEmoji="🌍"
          gameTitle="Continent Sprint"
          run={alreadyPlayedRun}
          totalPlayersToday={totalPlayersToday}
        />
      </div>
    );
  }

  return (
    <GameShell title="Continent Sprint" backHref="/games/continent-sprint" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="continent-sprint" gameEmoji="🌍" gameTitle="Continent Sprint">
          <SprintBoard mode={gameMode} />
        </DailyLockoutGuard>
      ) : (
        <SprintBoard mode={gameMode} />
      )}
    </GameShell>
  );
}
