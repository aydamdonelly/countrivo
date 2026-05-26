"use client";

import { Suspense } from "react";
import { GameShell } from "@/components/game/game-shell";
import { BlitzBoard } from "@/components/games/blitz/blitz-board";

function PlayContent() {
  return (
    <GameShell title="Blitz" backHref="/games/blitz" mode="practice">
      <BlitzBoard mode="practice" />
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
