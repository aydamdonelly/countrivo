import { getCountryByIso3 } from "@/lib/data/countries";
import { formatNumber } from "@/lib/utils";
import { ROUND_WEIGHTS, isGuessStat, valueOf } from "@/lib/game-logic/stat-guesser/engine";
import { Flag } from "@/ui/flag";
import type { RunDetailProps } from "@/games/types";
import { gradeWord, statName, valueText } from "./format";
import { pointsTone } from "./module";

function numbers(value: unknown): (number | null)[] {
  return Array.isArray(value) ? value.map((x) => (typeof x === "number" && Number.isFinite(x) ? x : null)) : [];
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
}

/**
 * The rows behind a shared Stat Guesser run (blueprint 7.7). A version 2 run (the ruler
 * rules) carries the countries, stats, guesses and points, so each row prints the guess, the
 * true value and the points. Runs saved under the old typed-number rules print the countries,
 * the guesses and how far off they were, and nothing invented.
 */
export function RunDetail({ run }: RunDetailProps) {
  const json = run.resultJson ?? {};
  const targets = strings(json.targetIso3s);
  if (targets.length === 0) return null;
  const guesses = numbers(json.guesses);

  if (json.v === 2) {
    const stats = strings(json.stats);
    const points = numbers(json.points);
    const total = typeof json.total === "number" ? json.total : null;
    return (
      <div>
        {total !== null ? (
          <div className="rhead">
            <b className="t-h3">{gradeWord(total)}</b>
            <span className="rfacts t-body">
              <b className="num">{total}</b> of 600
            </span>
          </div>
        ) : null}
        <div className="rrows t-row">
          {targets.map((iso3, i) => {
            const country = getCountryByIso3(iso3);
            const slug = stats[i] ?? "";
            const stat = isGuessStat(slug) ? slug : null;
            const guess = guesses[i] ?? null;
            const actual = stat ? valueOf(iso3, stat) : null;
            const p = points[i] ?? null;
            const w = ROUND_WEIGHTS[i] ?? 1;
            return (
              <div key={`${iso3}-${i}`} className="rrow cols4">
                <Flag iso2={country?.iso2 ?? null} size="xs" alt="" />
                <span className="nm">
                  {country?.displayName ?? iso3}
                  {stat ? (
                    <small className="t-meta">
                      {statName(stat)}
                      {guess !== null ? `, guessed ${valueText(stat, guess)}` : ""}
                    </small>
                  ) : null}
                </span>
                <b className="v t-score num">{stat && actual !== null ? valueText(stat, actual) : ""}</b>
                <span className={`v t-meta num ${p !== null && pointsTone(p) === "bad" ? "bad" : "mute"}`}>
                  {p === null ? "" : `${p * w} of ${100 * w}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Version 1: the typed-number rules, scored on percentage error.
  const scores = numbers(json.scores);
  return (
    <div className="rrows t-row">
      {targets.map((iso3, i) => {
        const country = getCountryByIso3(iso3);
        const error = scores[i] ?? null;
        const guess = guesses[i] ?? null;
        return (
          <div key={`${iso3}-${i}`} className="rrow cols4">
            <Flag iso2={country?.iso2 ?? null} size="xs" alt="" />
            <span className="nm">{country?.displayName ?? iso3}</span>
            <b className="v t-score num">{guess === null ? "" : formatNumber(guess)}</b>
            <span className="v t-meta mute">{error === null ? "" : `${Math.min(100, error)} % off`}</span>
          </div>
        );
      })}
    </div>
  );
}
