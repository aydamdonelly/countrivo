import { GameShell } from "@/components/game/game-shell";
import { BlitzBoard } from "@/components/games/blitz/blitz-board";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function BlitzPlayPage({ searchParams }: Props) {
  await searchParams;
  // BlitzBoard only supports practice mode today; daily lives elsewhere.
  return (
    <GameShell title="Blitz" backHref="/games/blitz" mode="practice">
      <BlitzBoard mode="practice" />
    </GameShell>
  );
}
