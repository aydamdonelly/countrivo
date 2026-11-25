import { getCountryByIso3 } from "@/lib/data/countries";
import type { RunDetailProps } from "@/games/types";

function strings(v: unknown): (string | null)[] | null {
  return Array.isArray(v) && v.every((s) => s === null || typeof s === "string") ? v : null;
}

/**
 * The rows behind a saved Capital Quiz run. The saved resultJson is
 * `{ v: 1, region, score, total, countries, capitals, picked, hits }`: one row per country
 * with the right capital, marked when the pick was wrong. Practice boards are never shared
 * with anyone else, so naming the answers spoils nothing.
 */
export function RunDetail({ run }: RunDetailProps) {
  const json = run.resultJson ?? {};
  const countries = strings(json.countries);
  const capitals = strings(json.capitals);
  const picked = strings(json.picked);
  if (!countries || !capitals || countries.length !== capitals.length) return null;
  return (
    <div className="rrows t-row">
      {countries.map((iso3, i) => {
        const name = (iso3 && getCountryByIso3(iso3)?.displayName) ?? iso3 ?? "";
        const pick = picked?.[i] ?? null;
        const wrong = pick !== null && pick !== capitals[i];
        return (
          <div key={`${iso3}-${i}`} className="rrow" style={{ gridTemplateColumns: "1fr auto" }}>
            <span className="nm">{name}{wrong ? <small className="t-meta">picked {pick}</small> : null}</span>
            <b className={wrong ? "v t-body bad" : "v t-body"}>{capitals[i]}</b>
          </div>
        );
      })}
    </div>
  );
}
