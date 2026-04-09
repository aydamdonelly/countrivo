import { GameShell } from "@/components/game/game-shell";
import { CountryleBoard } from "@/components/games/countryle/countryle-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function CountrylePlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";

  return (
    <GameShell title="Countryle" backHref="/games/countryle" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="countryle" gameEmoji="🌍" gameTitle="Countryle">
          <CountryleBoard mode={gameMode} />
        </DailyLockoutGuard>
      ) : (
        <CountryleBoard mode={gameMode} />
      )}
    </GameShell>
  );
}
