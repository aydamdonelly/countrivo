import { GameShell } from "@/components/game/game-shell";
import { CapitalBoard } from "@/components/games/capital-match/capital-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function CapitalMatchPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";

  return (
    <GameShell title="Capital Match" backHref="/games/capital-match" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="capital-match" gameEmoji="📍" gameTitle="Capital Match">
          <CapitalBoard mode={gameMode} />
        </DailyLockoutGuard>
      ) : (
        <CapitalBoard mode={gameMode} />
      )}
    </GameShell>
  );
}
