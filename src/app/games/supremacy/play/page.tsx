import { GameShell } from "@/components/game/game-shell";
import { SupremacyBoard } from "@/components/games/supremacy/supremacy-board";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function SupremacyPlayPage({ searchParams }: Props) {
  await searchParams;
  // SupremacyBoard only supports practice mode today; daily lives elsewhere.
  return (
    <GameShell title="Supremacy" backHref="/games/supremacy" mode="practice">
      <SupremacyBoard mode="practice" />
    </GameShell>
  );
}
