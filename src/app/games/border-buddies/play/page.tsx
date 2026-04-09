import { GameShell } from "@/components/game/game-shell";
import { BorderBoard } from "@/components/games/border-buddies/border-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function BorderBuddiesPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";

  return (
    <GameShell title="Border Buddies" backHref="/games/border-buddies" mode={gameMode}>
      {gameMode === "daily" ? (
        <DailyLockoutGuard gameSlug="border-buddies" gameEmoji="🔗" gameTitle="Border Buddies">
          <BorderBoard mode={gameMode} />
        </DailyLockoutGuard>
      ) : (
        <BorderBoard mode={gameMode} />
      )}
    </GameShell>
  );
}
