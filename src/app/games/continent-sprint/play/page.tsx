import { GameShell } from "@/components/game/game-shell";
import { SprintBoard } from "@/components/games/continent-sprint/sprint-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";
import { getDailyEdition } from "@/lib/daily-edition";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function ContinentSprintPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";
  const edition = await getDailyEdition();

  return (
    <GameShell title="Continent Sprint" backHref="/games/continent-sprint" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="continent-sprint" gameEmoji="🌍" gameTitle="Continent Sprint" edition={edition}>
          <SprintBoard mode={gameMode} edition={edition} />
        </DailyLockoutGuard>
      ) : (
        <SprintBoard mode={gameMode} edition={edition} />
      )}
    </GameShell>
  );
}
