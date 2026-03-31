"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { GameShell } from "@/components/game/game-shell";
import { FlagQuizBoard } from "@/components/games/flag-quiz/flag-quiz-board";

function Content() {
  const params = useSearchParams();
  const mode = params.get("mode") === "daily" ? "daily" : "practice";

  return (
    <GameShell title="Flag Quiz" backHref="/games/flag-quiz" mode={mode}>
      <FlagQuizBoard mode={mode} />
    </GameShell>
  );
}

export default function FlagQuizPlayPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-cream-muted">Loading...</div>}>
      <Content />
    </Suspense>
  );
}
