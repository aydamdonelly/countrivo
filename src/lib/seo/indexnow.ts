export type UrlStamps = Record<string, string>;

export interface PageTimestamps {
  generatedAt: string;
  entries: Record<string, { lastModified: string }>;
}

interface PageInventory {
  countries: readonly { slug: string }[];
  categories: readonly { slug: string }[];
  games: readonly { slug: string; route: string }[];
  listSlugs: readonly string[];
}

/** Resolve the same detail and hub dates as the sitemap, including its fallback. */
export function buildIndexNowStamps(
  timestamps: PageTimestamps,
  inventory: PageInventory,
  base: string,
): UrlStamps {
  const fallback = new Date(timestamps.generatedAt).toISOString();
  const stamp = (key: string) => new Date(timestamps.entries[key]?.lastModified ?? fallback).toISOString();
  const newest = (prefix: string) => {
    const dates = Object.keys(timestamps.entries).filter((key) => key.startsWith(prefix)).map(stamp);
    return dates.sort().at(-1) ?? fallback;
  };
  const gamesUpdated = newest("game:");
  const countriesUpdated = newest("country:");
  const resolved: UrlStamps = {
    [base]: gamesUpdated > countriesUpdated ? gamesUpdated : countriesUpdated,
    [`${base}/games`]: gamesUpdated,
    [`${base}/countries`]: countriesUpdated,
    [`${base}/categories`]: newest("category:"),
    [`${base}/lists`]: newest("list:"),
  };

  for (const country of inventory.countries) {
    resolved[`${base}/countries/${country.slug}`] = stamp(`country:${country.slug}`);
  }
  for (const category of inventory.categories) {
    resolved[`${base}/categories/${category.slug}`] = stamp(`category:${category.slug}`);
  }
  for (const game of inventory.games) resolved[`${base}${game.route}`] = stamp(`game:${game.slug}`);
  for (const slug of inventory.listSlugs) resolved[`${base}/lists/${slug}`] = stamp(`list:${slug}`);
  return resolved;
}

export function changedIndexNowUrls(current: UrlStamps, submitted: UrlStamps): string[] {
  return Object.keys(current).filter((url) => current[url] !== submitted[url]).sort();
}

export function acceptedIndexNowSnapshot(
  submitted: UrlStamps,
  current: UrlStamps,
  accepted: readonly string[],
): UrlStamps {
  const next = { ...submitted };
  for (const url of accepted) {
    if (current[url] !== undefined) next[url] = current[url];
  }
  return Object.fromEntries(Object.entries(next).sort(([left], [right]) => left.localeCompare(right)));
}
