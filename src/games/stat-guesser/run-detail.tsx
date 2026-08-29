import { getCountryByIso3 } from "@/lib/data/countries";
import { formatNumber } from "@/lib/utils";
import { Flag } from "@/ui/flag";
import type { RunDetailProps } from "@/games/types";
import { errorText, errorTone, gradeWord } from "./module";

function numbers(value: unknown): (number | null)[] {
  return Array.isArray(value) ? value.map((x) => (typeof x === "number" && Number.isFinite(x) ? x : null)) : [];
}

/**
 * The rows behind a shared Stat Guesser run (blueprint 7.7). The saved resultJson carries the
 * countries, the guesses and the per-round error, but not the categories or the true values,
 * so the rows print what was guessed and how far off it was, and nothing invented.
 */
export function RunDetail({ run }: RunDetailProps) {
  const json = run.resultJson ?? {};
  const targets = Array.isArray(json.targetIso3s)
    ? (json.targetIso3s as unknown[]).filter((x): x is string => typeof x === "string")
    : typeof json.targetIso3 === "string"
      ? [json.targetIso3]
      : [];
  if (targets.length === 0) return null;
  const scores = numbers(json.scores);
  const guesses = numbers(json.guesses);
  const avg = typeof json.avgError === "number" ? json.avgError : null;

  return (
    <div>
      {avg !== null ? (
        <div className="rhead">
          <b className="t-h3">{gradeWord(avg)}</b>
          <span className="rfacts t-body">
            avg error <b className="num">{errorText(avg)} %</b>
          </span>
        </div>
      ) : null}
      <div className="rrows t-row">
        <div className="rrow cols4 border-t-0 min-h-0 pt-2 pb-1">
          <span />
          <span />
          <span className="v mute t-meta">guess</span>
          <span />
        </div>
        {targets.map((iso3, i) => {
          const country = getCountryByIso3(iso3);
          const error = scores[i] ?? null;
          const guess = guesses[i] ?? null;
          return (
            <div key={`${iso3}-${i}`} className="rrow cols4">
              <Flag iso2={country?.iso2 ?? null} size="xs" alt="" />
              <span className="nm">{country?.displayName ?? iso3}</span>
              <b className="v t-score num">{guess === null ? "" : formatNumber(guess)}</b>
              <span className={`v t-meta ${error !== null && errorTone(error) === "bad" ? "bad" : "mute"}`}>{error === null ? "" : `${errorText(error)} % off`}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
