import { GameShell } from "@/components/game/game-shell";
import { FlagQuizBoard } from "@/components/games/flag-quiz/flag-quiz-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function FlagQuizPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";

  return (
    <GameShell title="Flag Quiz" backHref="/games/flag-quiz" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="flag-quiz" gameEmoji="🏁" gameTitle="Flag Quiz">
          <FlagQuizBoard mode={gameMode} />
        </DailyLockoutGuard>
      ) : (
        <FlagQuizBoard mode={gameMode} />
      )}
    </GameShell>
  );
}
