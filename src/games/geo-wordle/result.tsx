"use client";

import { answerCountry, type GeoWordleState } from "@/lib/game-logic/geo-wordle/engine";
import { Flag } from "@/ui/flag";
import type { ResultProps } from "@/games/types";
import { closestKm, kmLabel } from "./module";

/** The word for a win, by how many tries it took. */
function grade(used: number): string {
  if (used === 1) return "First try.";
  if (used <= 3) return "Sharp.";
  return "Got there.";
}

/**
 * The result head, in the house grammar (blueprint 8.7): a word in `.t-h3` on the left, the
 * facts on the right. The board stays above the panel with its six rows and the map's ember
 * answer ring (`keepBoardOnResult`), so the only row this adds is the reveal after a loss
 * (blueprint 8.8).
 */
export function Result({ state }: ResultProps<GeoWordleState>) {
  if (state.phase === "playing") return null;
  const won = state.phase === "won";
  const answer = answerCountry(state);
  // On a win the winning guess is 0 km away, so the fact worth printing is the nearest miss.
  const misses = state.guesses.filter((g) => !g.correct);
  const closest = won ? (misses.length ? Math.min(...misses.map((g) => g.distanceKm)) : null) : closestKm(state);
  return (
    <div>
      <div className="rhead">
        <b className="t-h3">{won ? grade(state.guesses.length) : `It was ${answer?.displayName ?? "another country"}.`}</b>
        {closest !== null ? (
          <span className="rfacts t-body">
            {won ? "closest miss" : "closest"} <b className="num">{kmLabel(closest)}</b>
          </span>
        ) : null}
      </div>
      {won ? null : (
        <div className="rrows t-row">
          <div className="rrow">
            <Flag iso2={answer?.iso2 ?? null} size="xs" alt="" />
            <span className="nm">
              {answer?.displayName ?? "the answer"}
              {answer?.subregion ? <small>{answer.subregion}</small> : null}
            </span>
            <span className="v mute t-meta">answer</span>
          </div>
        </div>
      )}
    </div>
  );
}
