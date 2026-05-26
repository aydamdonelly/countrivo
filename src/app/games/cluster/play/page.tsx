import Link from "next/link";
import { GameShell } from "@/components/game/game-shell";
import { ClusterBoard } from "@/components/games/cluster/cluster-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";
import {
  listAvailableDates,
  loadClusterPuzzle,
} from "@/lib/game-logic/cluster/generator";
import { getTodayDateKey } from "@/lib/daily-seed";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function ClusterPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";

  const todayKey = getTodayDateKey();
  const available = await listAvailableDates();

  let puzzleKey: string | null = null;
  if (gameMode === "daily") {
    const todaysPuzzle = await loadClusterPuzzle(todayKey);
    if (todaysPuzzle) puzzleKey = todayKey;
  } else if (available.length > 0) {
    // Server component: use clock as a seed so different visits land on
    // different practice puzzles. Avoids Math.random() in render path.
    const idx = Date.now() % available.length;
    puzzleKey = available[idx];
  }

  if (!puzzleKey) {
    return (
      <GameShell title="Cluster" backHref="/games/cluster" mode={gameMode}>
        <div className="max-w-md mx-auto text-center py-12 px-4">
          <span className="text-5xl block mb-4">🎴</span>
          <h2 className="text-2xl font-extrabold mb-2">No puzzle yet</h2>
          <p className="text-cream-muted mb-6">
            {gameMode === "daily"
              ? "Today's Cluster has not been curated yet. Try practice mode below."
              : "No practice puzzles available."}
          </p>
          {gameMode === "daily" && available.length > 0 && (
            <Link href="/games/cluster/play?mode=practice" className="cta-primary">
              Play practice puzzle
            </Link>
          )}
        </div>
      </GameShell>
    );
  }

  const puzzle = await loadClusterPuzzle(puzzleKey);
  if (!puzzle) {
    return (
      <GameShell title="Cluster" backHref="/games/cluster" mode={gameMode}>
        <div className="max-w-md mx-auto text-center py-12 px-4">
          <p className="text-cream-muted">Puzzle file is invalid.</p>
        </div>
      </GameShell>
    );
  }

  const boardDateKey = gameMode === "daily" ? puzzleKey : `practice-${puzzleKey}`;

  return (
    <GameShell title="Cluster" backHref="/games/cluster" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="cluster" gameEmoji="🎴" gameTitle="Cluster">
          <ClusterBoard puzzle={puzzle} dateKey={boardDateKey} mode={gameMode} />
        </DailyLockoutGuard>
      ) : (
        <ClusterBoard puzzle={puzzle} dateKey={boardDateKey} mode={gameMode} />
      )}
    </GameShell>
  );
}
