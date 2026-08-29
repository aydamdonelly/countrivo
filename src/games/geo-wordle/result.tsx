"use client";

import type { GeoWordleState } from "@/lib/game-logic/geo-wordle/engine";
import type { ResultProps } from "@/games/types";
import { answerName } from "./module";

/** The board stays up with the guess rows and the revealed map; here only the answer line when lost. */
export function Result({ state }: ResultProps<GeoWordleState>) {
  if (state.phase !== "lost") return null;
  return <p className="t-body play-line">It was <b>{answerName(state)}</b>.</p>;
}
