"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { GameShell } from "@/components/game/game-shell";
import { OddBoard } from "@/components/games/odd-one-out/odd-board";

function Content() {
  const params = useSearchParams();
  const mode = params.get("mode") === "daily" ? "daily" : "practice";

  return (
    <GameShell title="Odd One Out" backHref="/games/odd-one-out" mode={mode}>
      <OddBoard mode={mode} />
    </GameShell>
  );
}

export default function OddOneOutPlayPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-cream-muted">Loading...</div>}>
      <Content />
    </Suspense>
  );
}
