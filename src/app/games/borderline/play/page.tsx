"use client";

import { Suspense } from "react";
import { GameShell } from "@/components/game/game-shell";
import { BorderlineBoard } from "@/components/games/borderline/borderline-board";

function PlayContent() {
  return (
    <GameShell title="Borderline" backHref="/games/borderline" mode="practice">
      <BorderlineBoard mode="practice" />
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
