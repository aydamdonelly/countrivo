import { GameShell } from "@/components/game/game-shell";
import { FlagQuizBoard } from "@/components/games/flag-quiz/flag-quiz-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";
import { getDailyEdition } from "@/lib/daily-edition";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function FlagQuizPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";
  const edition = await getDailyEdition();

  return (
    <GameShell title="Flag Quiz" backHref="/games/flag-quiz" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="flag-quiz" gameEmoji="🏁" gameTitle="Flag Quiz" edition={edition}>
          <FlagQuizBoard mode={gameMode} edition={edition} />
        </DailyLockoutGuard>
      ) : (
        <FlagQuizBoard mode={gameMode} edition={edition} />
      )}
    </GameShell>
  );
}
