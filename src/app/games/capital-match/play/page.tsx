import { GameShell } from "@/components/game/game-shell";
import { CapitalBoard } from "@/components/games/capital-match/capital-board";
import { DailyAlreadyPlayed } from "@/components/game/daily-already-played";
import { checkDailyStatus, getDailySummary } from "@/app/actions/game-runs";
import { getTodayDateKey } from "@/lib/daily-seed";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function CapitalMatchPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";

  let alreadyPlayedRun = null;
  let totalPlayersToday = 0;

  if (gameMode === "daily") {
    const dateKey = getTodayDateKey();
    const [status, summary] = await Promise.all([
      checkDailyStatus("capital-match", dateKey),
      getDailySummary("capital-match", dateKey),
    ]);
    if (status.played && status.run) alreadyPlayedRun = status.run;
    totalPlayersToday = summary.playerCount;
  }

  if (alreadyPlayedRun) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DailyAlreadyPlayed
          gameSlug="capital-match"
          gameEmoji="🏛️"
          gameTitle="Capital Match"
          run={alreadyPlayedRun}
          totalPlayersToday={totalPlayersToday}
        />
      </div>
    );
  }

  return (
    <GameShell title="Capital Match" backHref="/games/capital-match" mode={gameMode}>
      <CapitalBoard mode={gameMode} />
    </GameShell>
  );
}
