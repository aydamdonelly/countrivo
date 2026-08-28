import { GameShell } from "@/components/game/game-shell";
import { BorderlineBoard } from "@/components/games/borderline/borderline-board";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Borderline · Play",
  robots: { index: false, follow: true },
};

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function BorderlinePlayPage({ searchParams }: Props) {
  // Per-request seed for the first practice board; the client re-seeds on reset.
  // eslint-disable-next-line react-hooks/purity -- request-time seed, server component
  const practiceSeed = Date.now();
  await searchParams;
  // BorderlineBoard only supports practice mode today; daily lives elsewhere.
  return (
    <GameShell title="Borderline" backHref="/games/borderline" mode="practice">
      <BorderlineBoard mode="practice" practiceSeed={practiceSeed} />
    </GameShell>
  );
}
