"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { GameShell } from "@/components/game/game-shell";
import { CapitalBoard } from "@/components/games/capital-match/capital-board";

function Content() {
  const params = useSearchParams();
  const mode = params.get("mode") === "daily" ? "daily" : "practice";

  return (
    <GameShell title="Capital Match" backHref="/games/capital-match" mode={mode}>
      <CapitalBoard mode={mode} />
    </GameShell>
  );
}

export default function CapitalMatchPlayPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-cream-muted">Loading...</div>}>
      <Content />
    </Suspense>
  );
}
