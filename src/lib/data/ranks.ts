import ranksData from "@/data/ranks.json";
import statsData from "@/data/stats.json";

const ranks: Record<string, Record<string, number>> = ranksData;
const stats: Record<string, Record<string, number | null>> = statsData;

export function getRank(iso3: string, categorySlug: string): number | undefined {
  return ranks[iso3]?.[categorySlug];
}

export function getRanksForCountry(iso3: string): Record<string, number> {
  return ranks[iso3] || {};
}

export function getStatValue(iso3: string, categorySlug: string): number | null {
  return stats[iso3]?.[categorySlug] ?? null;
}

export function getTopCountries(categorySlug: string, n: number): { iso3: string; rank: number }[] {
  const entries: { iso3: string; rank: number }[] = [];
  for (const [iso3, countryRanks] of Object.entries(ranks)) {
    if (countryRanks[categorySlug] !== undefined) {
      entries.push({ iso3, rank: countryRanks[categorySlug] });
    }
  }
  entries.sort((a, b) => a.rank - b.rank);
  return entries.slice(0, n);
}
