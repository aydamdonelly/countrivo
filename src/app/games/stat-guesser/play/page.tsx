import { GameShell } from "@/components/game/game-shell";
import { GuesserBoard } from "@/components/games/stat-guesser/guesser-board";
import { DailyAlreadyPlayed } from "@/components/game/daily-already-played";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";
import { checkDailyStatus, getDailySummary } from "@/app/actions/game-runs";
import { getTodayDateKey } from "@/lib/daily-seed";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function StatGuesserPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";

  let alreadyPlayedRun = null;
  let totalPlayersToday = 0;

  if (gameMode === "daily") {
    const dateKey = getTodayDateKey();
    const [status, summary] = await Promise.all([
      checkDailyStatus("stat-guesser", dateKey),
      getDailySummary("stat-guesser", dateKey),
    ]);
    if (status.played && status.run) alreadyPlayedRun = status.run;
    totalPlayersToday = summary.playerCount;
  }

  if (alreadyPlayedRun) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DailyAlreadyPlayed
          gameSlug="stat-guesser"
          gameEmoji="🔢"
          gameTitle="Stat Guesser"
          run={alreadyPlayedRun}
          totalPlayersToday={totalPlayersToday}
        />
      </div>
    );
  }

  return (
    <GameShell title="Stat Guesser" backHref="/games/stat-guesser" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="stat-guesser" gameEmoji="#️⃣" gameTitle="Stat Guesser">
          <GuesserBoard mode={gameMode} />
        </DailyLockoutGuard>
      ) : (
        <GuesserBoard mode={gameMode} />
      )}
    </GameShell>
  );
}
