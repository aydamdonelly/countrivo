"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { GameShell } from "@/components/game/game-shell";
import { GuesserBoard } from "@/components/games/stat-guesser/guesser-board";

function Content() {
  const params = useSearchParams();
  const mode = params.get("mode") === "daily" ? "daily" : "practice";

  return (
    <GameShell title="Stat Guesser" backHref="/games/stat-guesser" mode={mode}>
      <GuesserBoard mode={mode} />
    </GameShell>
  );
}

export default function StatGuesserPlayPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-cream-muted">Loading...</div>}>
      <Content />
    </Suspense>
  );
}
