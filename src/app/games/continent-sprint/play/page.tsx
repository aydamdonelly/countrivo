import { GameShell } from "@/components/game/game-shell";
import { SprintBoard } from "@/components/games/continent-sprint/sprint-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function ContinentSprintPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";

  return (
    <GameShell title="Continent Sprint" backHref="/games/continent-sprint" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="continent-sprint" gameEmoji="🌍" gameTitle="Continent Sprint">
          <SprintBoard mode={gameMode} />
        </DailyLockoutGuard>
      ) : (
        <SprintBoard mode={gameMode} />
      )}
    </GameShell>
  );
}
