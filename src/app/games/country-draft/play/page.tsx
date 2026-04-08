import Link from "next/link";
import { DraftBoard } from "@/components/games/country-draft/draft-board";
import { DailyAlreadyPlayed } from "@/components/game/daily-already-played";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";
import { checkDailyStatus, getDailySummary } from "@/app/actions/game-runs";
import { getTodayDateKey } from "@/lib/daily-seed";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function DraftPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";

  let alreadyPlayedRun = null;
  let totalPlayersToday = 0;

  if (gameMode === "daily") {
    const dateKey = getTodayDateKey();
    const status = await checkDailyStatus("country-draft", dateKey);
    if (status.played && status.run) {
      alreadyPlayedRun = status.run;
      const summary = await getDailySummary("country-draft", dateKey);
      totalPlayersToday = summary.playerCount;
    }
  }

  if (alreadyPlayedRun) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DailyAlreadyPlayed
          gameSlug="country-draft"
          gameEmoji="🎯"
          gameTitle="Country Draft"
          run={alreadyPlayedRun}
          totalPlayersToday={totalPlayersToday}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/games/country-draft"
          className="text-base font-medium text-cream-muted hover:text-cream transition-colors"
        >
          ← Back
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <span className={`text-base font-bold uppercase tracking-wider ${
            gameMode === "daily" ? "text-gold" : "text-cream-muted"
          }`}>
            {gameMode === "daily" ? "Daily Challenge" : "Practice"}
          </span>
        </div>
      </div>
      {gameMode === "daily" ? (
          <DailyLockoutGuard gameSlug="country-draft" gameEmoji="🎯" gameTitle="Country Draft">
            <DraftBoard mode={gameMode} />
          </DailyLockoutGuard>
        ) : (
          <DraftBoard mode={gameMode} />
        )}
    </div>
  );
}
