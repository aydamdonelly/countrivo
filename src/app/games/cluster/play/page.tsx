import { GameShell } from "@/components/game/game-shell";
import { ClusterBoard } from "@/components/games/cluster/cluster-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";
import { getDailyEdition } from "@/lib/daily-edition";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cluster · Play",
  robots: { index: false, follow: true },
};

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function ClusterPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";
  const edition = await getDailyEdition();

  return (
    <GameShell title="Cluster" backHref="/games/cluster" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="cluster" gameEmoji="🧩" gameTitle="Cluster" edition={edition}>
          <ClusterBoard mode={gameMode} edition={edition} />
        </DailyLockoutGuard>
      ) : (
        <ClusterBoard mode={gameMode} edition={edition} />
      )}
    </GameShell>
  );
}
