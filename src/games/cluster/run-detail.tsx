import { getCountryByIso3 } from "@/lib/data/countries";
import { CLUSTER_GROUP_COUNT, CLUSTER_GROUP_SIZE } from "@/lib/game-logic/cluster/engine";
import { Flag } from "@/ui/flag";
import type { RunDetailProps } from "@/games/types";

/** A saved run carries the members, not the trait labels, so the rows name the countries. */
function isoList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") return null;
    out.push(item);
  }
  return out;
}

function isoLists(value: unknown): string[][] {
  if (!Array.isArray(value)) return [];
  const out: string[][] = [];
  for (const item of value) {
    const list = isoList(item);
    if (list) out.push(list);
  }
  return out;
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(b);
  return a.every((iso3) => set.has(iso3));
}

/**
 * The run page rows (blueprint 7.7): the four groups of the saved board, each marked found or
 * missed by matching it against the submitted quartets in `resultJson`.
 */
export function RunDetail({ run }: RunDetailProps) {
  const json = run.resultJson ?? {};
  const groups = isoLists(json.groups).filter((members) => members.length === CLUSTER_GROUP_SIZE);
  if (groups.length === 0) return null;
  const guesses = isoLists(json.guesses);
  const mistakes = typeof json.mistakes === "number" ? json.mistakes : null;
  const found = groups.map((members) => guesses.some((guess) => sameSet(guess, members)));
  const solved = found.filter(Boolean).length;
  return (
    <div className="play-stack">
      <div className="rhead">
        <span className="rfacts t-body">
          groups <b className="num">{solved}/{CLUSTER_GROUP_COUNT}</b>
          {mistakes === null ? null : (
            <>
              {" · mistakes "}
              <b className="num">{mistakes}</b>
            </>
          )}
        </span>
      </div>
      <div className="rrows t-row">
        {groups.map((members, i) => (
          <div key={members.join("")} className="rrow" style={{ gridTemplateColumns: "1fr auto", alignItems: "start" }}>
            <span className="nm" style={{ whiteSpace: "normal", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 12px" }}>
              {members.map((iso3) => {
                const country = getCountryByIso3(iso3);
                return (
                  <span key={iso3} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Flag iso2={country?.iso2 ?? ""} size="xs" alt="" />
                    {country?.displayName ?? iso3}
                  </span>
                );
              })}
            </span>
            {found[i] ? null : <b className="v t-meta bad">missed</b>}
          </div>
        ))}
      </div>
    </div>
  );
}
