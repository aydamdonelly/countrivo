"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { GameShell } from "@/components/game/game-shell";
import { SpeedBoard } from "@/components/games/speed-flags/speed-board";

function Content() {
  const params = useSearchParams();
  const mode = params.get("mode") === "daily" ? "daily" : "practice";

  return (
    <GameShell title="Speed Flags" backHref="/games/speed-flags" mode={mode}>
      <SpeedBoard mode={mode} />
    </GameShell>
  );
}

export default function SpeedFlagsPlayPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-text-muted">Loading...</div>}>
      <Content />
    </Suspense>
  );
}
