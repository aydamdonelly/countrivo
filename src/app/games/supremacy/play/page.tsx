"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GameShell } from "@/components/game/game-shell";
import { SupremacyBoard } from "@/components/games/supremacy/supremacy-board";

function PlayContent() {
  const params = useSearchParams();
  const rawMode = params.get("mode");
  const mode = rawMode === "versus" ? "versus" : "practice";
  const roomCode = params.get("room") ?? null;

  return (
    <GameShell
      title="Supremacy"
      backHref="/games/supremacy"
      mode={mode === "versus" ? "versus" : "practice"}
    >
      <SupremacyBoard mode={mode} roomCode={roomCode} />
    </GameShell>
  );
}

export default function SupremacyPlayPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-8 text-cream-muted">Loading...</div>
      }
    >
      <PlayContent />
    </Suspense>
  );
}
