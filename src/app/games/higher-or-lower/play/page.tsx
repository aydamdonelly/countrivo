"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { GameShell } from "@/components/game/game-shell";
import { HoLBoard } from "@/components/games/higher-or-lower/hol-board";

function Content() {
  const params = useSearchParams();
  const mode = params.get("mode") === "daily" ? "daily" : "practice";

  return (
    <GameShell title="Higher or Lower" backHref="/games/higher-or-lower" mode={mode}>
      <HoLBoard mode={mode} />
    </GameShell>
  );
}

export default function HoLPlayPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-text-muted">Loading...</div>}>
      <Content />
    </Suspense>
  );
}
