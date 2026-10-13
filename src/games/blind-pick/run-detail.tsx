import { getCountryByIso3 } from "@/lib/data/countries";
import { Flag } from "@/ui/flag";
import type { RunDetailProps } from "@/games/types";
import { BoardOverlay } from "./overlay";

function ints(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  return value.every((v): v is number => typeof v === "number" && Number.isInteger(v)) ? value : null;
}

function strings(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.every((v): v is string => typeof v === "string") ? value : null;
}

/**
 * The rows behind a shared Blind Pick run (R6 on the run page). A 6 x 6 run (resultJson v2)
 * renders the same overlay as the live result. A run saved under the old eight-pick rules
 * keeps a plain list: each country with the rank it was given.
 */
export function RunDetail({ run }: RunDetailProps) {
  const json = run.resultJson ?? {};
  const iso3s = strings(json.countryIso3s) ?? [];
  const stats = strings(json.stats);
  const placements = ints(json.placements);
  const ranks = ints(json.ranks);
  const perfect = ints(json.perfect);
  const perfectRanks = ints(json.perfectRanks);

  if (stats && placements && ranks && perfect && perfectRanks && typeof json.over === "number") {
    const countries = iso3s.map((iso3) => {
      const c = getCountryByIso3(iso3);
      return { iso2: c?.iso2 ?? "", name: c?.displayName ?? iso3 };
    });
    return (
      <BoardOverlay
        d={{
          stats,
          countries,
          placements,
          ranks,
          perfect,
          perfectRanks,
          over: json.over,
          par: typeof json.par === "number" ? json.par : undefined,
        }}
      />
    );
  }

  // A run from the eight-pick rules (before October 2026).
  const legacy = Array.isArray(json.assignments)
    ? json.assignments.filter(
        (a): a is { countryIdx: number; rank: number } =>
          typeof a === "object" && a !== null && typeof (a as { countryIdx?: unknown }).countryIdx === "number" && typeof (a as { rank?: unknown }).rank === "number",
      )
    : [];
  if (legacy.length === 0) return null;
  return (
    <div className="rrows t-row">
      {legacy.map((a) => {
        const country = getCountryByIso3(iso3s[a.countryIdx] ?? "");
        return (
          <div key={a.countryIdx} className="rrow">
            <Flag iso2={country?.iso2 ?? null} size="xs" alt="" />
            <span className="nm">{country?.displayName ?? iso3s[a.countryIdx] ?? "Country"}</span>
            <b className="v t-num num">#{a.rank}</b>
          </div>
        );
      })}
    </div>
  );
}
