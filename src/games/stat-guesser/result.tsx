import { PAR, ROUND_WEIGHTS, type StatGuesserState } from "@/lib/game-logic/stat-guesser/engine";
import { Flag } from "@/ui/flag";
import type { ResultProps } from "@/games/types";
import { gradeWord, statName, valueText } from "./format";
import { pointsTone, totalScore } from "./module";

/**
 * The result rows (concept 5.6, pane R): the read against par, then one row per round with
 * the country, the stat, the true value and the points it earned (round 5 doubled).
 */
export function Result({ state }: ResultProps<StatGuesserState>) {
  const total = totalScore(state);
  const best = Math.max(...state.points.map((p) => p ?? 0));
  return (
    <div>
      <div className="rhead">
        <b className="t-h3">{gradeWord(total)}</b>
        <span className="rfacts t-body">
          par <b className="num">{PAR}</b>, best round <b className="num">{best}</b>
        </span>
      </div>
      <div className="rrows t-row">
        {state.rounds.map((round, i) => {
          const p = state.points[i] ?? 0;
          const w = ROUND_WEIGHTS[i] ?? 1;
          return (
            <div key={`${round.country.iso3}-${i}`} className="rrow cols4">
              <Flag iso2={round.country.iso2} size="xs" alt="" />
              <span className="nm">
                {round.country.name}
                <small className="t-meta">{statName(round.stat)}</small>
              </span>
              <b className="v t-score num">{valueText(round.stat, round.actualValue)}</b>
              <span className={`v t-meta num ${pointsTone(p) === "bad" ? "bad" : "mute"}`}>
                {p * w} of {100 * w}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
