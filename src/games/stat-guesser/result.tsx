"use client";

import { formatStat } from "@/lib/utils";
import type { StatGuesserState } from "@/lib/game-logic/stat-guesser/engine";
import { Flag } from "@/ui/flag";
import type { ResultProps } from "@/games/types";
import { statLabel } from "@/games/_shared/format";
import { errorText, errorTone, gradeWord, reportedError } from "./module";

/**
 * The result rows (blueprint 8.8): the grade word and the spread, then the five countries
 * with the stat, the number that was true, and how far the guess landed from it.
 */
export function Result({ state }: ResultProps<StatGuesserState>) {
  const errors = state.scores.map((x) => x ?? 0);
  const best = Math.min(...errors);
  const worst = Math.max(...errors);
  // The card's number is the compact `18 % off`; the average it stands for is spelled out here.
  const avg = reportedError(state);
  return (
    <div>
      <div className="rhead">
        <b className="t-h3">{gradeWord(avg)}</b>
        <span className="rfacts t-body">
          avg <b className="num">{errorText(avg)} %</b> · best <b className="num">{errorText(best)} %</b> · worst{" "}
          <b className="num">{errorText(worst)} %</b>
        </span>
      </div>
      <div className="rrows t-row">
        {state.rounds.map((round, i) => (
          <div key={`${round.country.iso3}-${i}`} className="rrow cols4">
            <Flag iso2={round.country.iso2} size="xs" alt="" />
            <span className="nm">
              {round.country.displayName}
              <small className="t-meta">{statLabel(round.category.slug, round.category.shortLabel)}</small>
            </span>
            <b className="v t-score num">{formatStat(round.actualValue, round.category.unit)}</b>
            <span className={`v t-meta ${errorTone(errors[i]) === "bad" ? "bad" : "mute"}`}>{errorText(errors[i])} % off</span>
          </div>
        ))}
      </div>
    </div>
  );
}
