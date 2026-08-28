import { GameShell } from "@/components/game/game-shell";
import { SupremacyBoard } from "@/components/games/supremacy/supremacy-board";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Supremacy · Play",
  robots: { index: false, follow: true },
};

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function SupremacyPlayPage({ searchParams }: Props) {
  // Per-request seed for the first practice board; the client re-seeds on reset.
  // eslint-disable-next-line react-hooks/purity -- request-time seed, server component
  const practiceSeed = Date.now();
  await searchParams;
  // SupremacyBoard only supports practice mode today; daily lives elsewhere.
  return (
    <GameShell title="Supremacy" backHref="/games/supremacy" mode="practice">
      <SupremacyBoard mode="practice" practiceSeed={practiceSeed} />
    </GameShell>
  );
}
