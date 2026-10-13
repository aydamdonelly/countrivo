/**
 * Ranks among sovereign states only (concept 5.7 and 9.3). `ranks.json` ranks every one of
 * the 243 countries and territories (rank 1 = the highest value); this module re-ranks the
 * 195 sovereign states on their own, keeping ties (equal values share a rank, the next rank
 * skips). Built once at module load, pure data afterwards.
 */
import ranksData from "@/data/ranks.json";
import sovereignData from "@/data/sovereign.json";

const GLOBAL: Record<string, Record<string, number>> = ranksData;
const SOVEREIGN: readonly string[] = sovereignData;

export const SOVEREIGN_SET: ReadonlySet<string> = new Set(SOVEREIGN);

function build(): { ranks: Map<string, Map<string, number>>; counts: Map<string, number> } {
  const slugs = new Set<string>();
  for (const iso3 of SOVEREIGN) for (const slug of Object.keys(GLOBAL[iso3] ?? {})) slugs.add(slug);

  const ranks = new Map<string, Map<string, number>>();
  const counts = new Map<string, number>();
  for (const slug of slugs) {
    const entries: { iso3: string; g: number }[] = [];
    for (const iso3 of SOVEREIGN) {
      const g = GLOBAL[iso3]?.[slug];
      if (typeof g === "number" && Number.isFinite(g)) entries.push({ iso3, g });
    }
    entries.sort((a, b) => a.g - b.g || (a.iso3 < b.iso3 ? -1 : 1));
    let rank = 1;
    entries.forEach((e, i) => {
      if (i > 0 && e.g > entries[i - 1].g) rank = i + 1;
      let row = ranks.get(e.iso3);
      if (!row) {
        row = new Map();
        ranks.set(e.iso3, row);
      }
      row.set(slug, rank);
    });
    counts.set(slug, entries.length);
  }
  return { ranks, counts };
}

const BUILT = build();

/** The country's rank among sovereign states on a stat, or null when it has no number. */
export function sovereignRank(iso3: string, slug: string): number | null {
  return BUILT.ranks.get(iso3)?.get(slug) ?? null;
}

/** How many sovereign states are ranked on a stat (the "of 193"). */
export function sovereignCount(slug: string): number {
  return BUILT.counts.get(slug) ?? 0;
}
