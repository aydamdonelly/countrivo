"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GameShell } from "@/components/game/game-shell";
import { BorderlineBoard } from "@/components/games/borderline/borderline-board";

function PlayContent() {
  const params = useSearchParams();
  const rawMode = params.get("mode");
  const mode = rawMode === "versus" ? "versus" : "practice";
  const roomCode = params.get("room") ?? null;

  return (
    <GameShell
      title="Borderline"
      backHref="/games/borderline"
      mode={mode === "versus" ? "versus" : "practice"}
    >
      <BorderlineBoard mode={mode} roomCode={roomCode} />
    </GameShell>
  );
}

export default function BorderlinePlayPage() {
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
