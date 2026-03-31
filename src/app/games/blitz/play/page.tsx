"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GameShell } from "@/components/game/game-shell";
import { BlitzBoard } from "@/components/games/blitz/blitz-board";

function PlayContent() {
  const params = useSearchParams();
  const rawMode = params.get("mode");
  const mode = rawMode === "versus" ? "versus" : "practice";
  const roomCode = params.get("room") ?? null;

  return (
    <GameShell
      title="Blitz"
      backHref="/games/blitz"
      mode={mode === "versus" ? "versus" : "practice"}
    >
      <BlitzBoard mode={mode} roomCode={roomCode} />
    </GameShell>
  );
}

export default function BlitzPlayPage() {
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
