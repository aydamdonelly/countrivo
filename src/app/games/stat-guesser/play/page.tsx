import { GameShell } from "@/components/game/game-shell";
import { GuesserBoard } from "@/components/games/stat-guesser/guesser-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";
import { getDailyEdition } from "@/lib/daily-edition";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stat Guesser · Play",
  robots: { index: false, follow: true },
};

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function StatGuesserPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";
  const edition = await getDailyEdition();

  return (
    <GameShell title="Stat Guesser" backHref="/games/stat-guesser" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="stat-guesser" gameEmoji="#️⃣" gameTitle="Stat Guesser" edition={edition}>
          <GuesserBoard mode={gameMode} edition={edition} />
        </DailyLockoutGuard>
      ) : (
        <GuesserBoard mode={gameMode} edition={edition} />
      )}
    </GameShell>
  );
}
