"use client";

import type { BorderBuddiesState } from "@/lib/game-logic/border-buddies/engine";
import type { ResultProps } from "@/games/types";

/** The board stays up with every border checked or crossed; here the one-line summary. */
export function Result({ state }: ResultProps<BorderBuddiesState>) {
  const missed = state.borders.length - state.found.length;
  return <p className="t-body play-line">{missed === 0 ? "All borders found." : `${missed} missed.`}</p>;
}
