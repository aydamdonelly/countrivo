import { GameShell } from "@/components/game/game-shell";
import { BorderBoard } from "@/components/games/border-buddies/border-board";
import { DailyAlreadyPlayed } from "@/components/game/daily-already-played";
import { checkDailyStatus, getDailySummary } from "@/app/actions/game-runs";
import { getTodayDateKey } from "@/lib/daily-seed";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function BorderBuddiesPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";

  let alreadyPlayedRun = null;
  let totalPlayersToday = 0;

  if (gameMode === "daily") {
    const dateKey = getTodayDateKey();
    const [status, summary] = await Promise.all([
      checkDailyStatus("border-buddies", dateKey),
      getDailySummary("border-buddies", dateKey),
    ]);
    if (status.played && status.run) alreadyPlayedRun = status.run;
    totalPlayersToday = summary.playerCount;
  }

  if (alreadyPlayedRun) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DailyAlreadyPlayed
          gameSlug="border-buddies"
          gameEmoji="🗺️"
          gameTitle="Border Buddies"
          run={alreadyPlayedRun}
          totalPlayersToday={totalPlayersToday}
        />
      </div>
    );
  }

  return (
    <GameShell title="Border Buddies" backHref="/games/border-buddies" mode={gameMode}>
      <BorderBoard mode={gameMode} />
    </GameShell>
  );
}
