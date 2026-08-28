import { GameShell } from "@/components/game/game-shell";
import { GeoBoard } from "@/components/games/geo-wordle/geo-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";
import { getDailyEdition } from "@/lib/daily-edition";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GeoWordle · Play",
  robots: { index: false, follow: true },
};

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function GeoWordlePlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";
  const edition = await getDailyEdition();

  return (
    <GameShell title="GeoWordle" backHref="/games/geo-wordle" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="geo-wordle" gameEmoji="🌍" gameTitle="GeoWordle" edition={edition}>
          <GeoBoard mode={gameMode} edition={edition} />
        </DailyLockoutGuard>
      ) : (
        <GeoBoard mode={gameMode} edition={edition} />
      )}
    </GameShell>
  );
}
