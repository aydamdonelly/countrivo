"use client";

import { computeResult } from "@/lib/game-logic/blind-pick/scoring";
import type { ResultProps } from "@/games/types";
import type { BlindPickState } from "./module";
import { BoardOverlay } from "./overlay";

/** The rows under the result card (R6): your board over the perfect one, and the swaps. */
export function Result({ state }: ResultProps<BlindPickState>) {
  const r = computeResult(state.g);
  const cfg = state.g.config;
  return (
    <BoardOverlay
      d={{
        stats: cfg.categories.map((c) => c.slug),
        countries: cfg.countries.map((c) => ({ iso2: c.iso2, name: c.displayName })),
        placements: r.placements,
        ranks: r.ranks,
        perfect: r.perfect,
        perfectRanks: r.perfectRanks,
        over: r.over,
      }}
    />
  );
}
