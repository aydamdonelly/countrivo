import { GameShell } from "@/components/game/game-shell";
import { GuesserBoard } from "@/components/games/stat-guesser/guesser-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function StatGuesserPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";

  return (
    <GameShell title="Stat Guesser" backHref="/games/stat-guesser" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="stat-guesser" gameEmoji="#️⃣" gameTitle="Stat Guesser">
          <GuesserBoard mode={gameMode} />
        </DailyLockoutGuard>
      ) : (
        <GuesserBoard mode={gameMode} />
      )}
    </GameShell>
  );
}
