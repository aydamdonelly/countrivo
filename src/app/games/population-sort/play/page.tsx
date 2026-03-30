"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { GameShell } from "@/components/game/game-shell";
import { SortBoard } from "@/components/games/population-sort/sort-board";

function Content() {
  const params = useSearchParams();
  const mode = params.get("mode") === "daily" ? "daily" : "practice";

  return (
    <GameShell title="Population Sort" backHref="/games/population-sort" mode={mode}>
      <SortBoard mode={mode} />
    </GameShell>
  );
}

export default function PopulationSortPlayPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-text-muted">Loading...</div>}>
      <Content />
    </Suspense>
  );
}
