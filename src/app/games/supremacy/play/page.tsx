"use client";

import { Suspense } from "react";
import { GameShell } from "@/components/game/game-shell";
import { SupremacyBoard } from "@/components/games/supremacy/supremacy-board";

function PlayContent() {
  return (
    <GameShell title="Supremacy" backHref="/games/supremacy" mode="practice">
      <SupremacyBoard mode="practice" />
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
