import { GameShell } from "@/components/game/game-shell";
import { BorderBoard } from "@/components/games/border-buddies/border-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";
import { getDailyEdition } from "@/lib/daily-edition";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Border Buddies · Play",
  robots: { index: false, follow: true },
};

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function BorderBuddiesPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";
  const edition = await getDailyEdition();

  return (
    <GameShell title="Border Buddies" backHref="/games/border-buddies" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="border-buddies" gameEmoji="🔗" gameTitle="Border Buddies" edition={edition}>
          <BorderBoard mode={gameMode} edition={edition} />
        </DailyLockoutGuard>
      ) : (
        <BorderBoard mode={gameMode} edition={edition} />
      )}
    </GameShell>
  );
}
