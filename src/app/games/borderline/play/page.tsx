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
  await searchParams;
  // BorderlineBoard only supports practice mode today; daily lives elsewhere.
  return (
    <GameShell title="Borderline" backHref="/games/borderline" mode="practice">
      <BorderlineBoard mode="practice" practiceSeed={Date.now()} />
    </GameShell>
  );
}
