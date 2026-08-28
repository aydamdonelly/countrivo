import { GameShell } from "@/components/game/game-shell";
import { HoLBoard } from "@/components/games/higher-or-lower/hol-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";
import { getDailyEdition } from "@/lib/daily-edition";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Higher or Lower · Play",
  robots: { index: false, follow: true },
};

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function HoLPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";
  const edition = await getDailyEdition();

  return (
    <GameShell title="Higher or Lower" backHref="/games/higher-or-lower" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="higher-or-lower" gameEmoji="⬆️" gameTitle="Higher or Lower" edition={edition}>
          <HoLBoard mode={gameMode} edition={edition} />
        </DailyLockoutGuard>
      ) : (
        <HoLBoard mode={gameMode} edition={edition} />
      )}
    </GameShell>
  );
}
