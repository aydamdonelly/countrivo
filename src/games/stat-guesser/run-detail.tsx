import { getCountryByIso3 } from "@/lib/data/countries";
import { Flag } from "@/ui/flag";
import type { RunDetailProps } from "@/games/types";

/** The Stat Guesser run rows from resultJson (targetIso3s, guesses, scores, avgError). */
export function RunDetail({ run }: RunDetailProps) {
  const json = run.resultJson ?? {};
  const targets = Array.isArray(json.targetIso3s) ? (json.targetIso3s as unknown[]).filter((x): x is string => typeof x === "string") : typeof json.targetIso3 === "string" ? [json.targetIso3] : [];
  const scores = Array.isArray(json.scores) ? (json.scores as unknown[]).map((x) => (typeof x === "number" ? x : null)) : [];
  if (targets.length === 0) return null;
  return (
    <div>
      {typeof json.avgError === "number" ? (
        <p className="rhead t-body">
          <span className="rfacts">
            avg error <b>{json.avgError} %</b>
          </span>
        </p>
      ) : null}
      <div className="rrows t-row">
        {targets.map((iso3, i) => {
          const c = getCountryByIso3(iso3);
          const e = scores[i];
          return (
            <div key={`${iso3}-${i}`} className="rrow">
              <Flag iso2={c?.iso2 ?? null} size="xs" alt="" />
              <span className="nm">{c?.displayName ?? iso3}</span>
              <span className={`v t-meta ${e !== null && e >= 50 ? "bad" : "mute"}`}>{e === null ? "" : `${e} % off`}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
