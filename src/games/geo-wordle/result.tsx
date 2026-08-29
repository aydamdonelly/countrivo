"use client";

import { answerCountry, type GeoWordleState } from "@/lib/game-logic/geo-wordle/engine";
import { Flag } from "@/ui/flag";
import type { ResultProps } from "@/games/types";
import { closestKm, kmLabel } from "./module";

/**
 * The board stays above the panel with its six rows and the map's ember answer ring
 * (`keepBoardOnResult`), so the only rows the result adds are the reveal after a loss
 * (blueprint 8.8).
 */
export function Result({ state }: ResultProps<GeoWordleState>) {
  if (state.phase !== "lost") return null;
  const answer = answerCountry(state);
  const closest = closestKm(state);
  return (
    <div>
      <p className="rhead t-body">
        <span className="rfacts">
          It was <b>{answer?.displayName ?? "another country"}</b>.
        </span>
        {closest !== null ? (
          <span className="rfacts">
            closest <b>{kmLabel(closest)}</b>
          </span>
        ) : null}
      </p>
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
    </div>
  );
}
