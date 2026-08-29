import { getCountryByIso3 } from "@/lib/data/countries";
import type { RunDetailProps } from "@/games/types";
import { FoundList } from "@/games/_shared/found-list";

/** The Border Buddies run rows from resultJson (country, found, borders). */
export function RunDetail({ run }: RunDetailProps) {
  const json = run.resultJson ?? {};
  const borders = Array.isArray(json.borders) ? (json.borders as unknown[]).filter((x): x is string => typeof x === "string") : [];
  const found = new Set(Array.isArray(json.found) ? (json.found as unknown[]).filter((x): x is string => typeof x === "string") : []);
  if (borders.length === 0) return null;
  const target = typeof json.country === "string" ? getCountryByIso3(json.country) : undefined;
  return (
    <div>
      {target ? (
        <p className="rhead t-body">
          <span className="rfacts">
            neighbours of <b>{target.displayName}</b>
          </span>
        </p>
      ) : null}
      <FoundList items={borders.map((iso3) => ({ iso2: getCountryByIso3(iso3)?.iso2 ?? "", name: getCountryByIso3(iso3)?.displayName ?? iso3, ok: found.has(iso3) }))} />
    </div>
  );
}
