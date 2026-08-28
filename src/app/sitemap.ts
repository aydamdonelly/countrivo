import type { MetadataRoute } from "next";
import { getAllCategories } from "@/lib/data/categories";
import timestamps from "@/data/data-timestamps.json";

export const BASE_URL = "https://countrivo.com";

interface TimestampEntry {
  hash: string;
  lastModified: string;
}

interface TimestampFile {
  generatedAt: string;
  entries: Record<string, TimestampEntry>;
}

const dataTimestamps: TimestampFile = timestamps;

// Falls back to the day the fingerprint file itself was built, so a brand new
// key never claims a date we can't back up.
const FALLBACK_LAST_MODIFIED = new Date(dataTimestamps.generatedAt);

/**
 * Real last-changed date for a page, keyed by "country:{slug}" /
 * "category:{slug}" / "list:{slug}" / "game:{slug}".
 *
 * Backed by scripts/build-data-timestamps.ts, which only moves a date when the
 * underlying data hash moves. Google discards <lastmod> that isn't verifiably
 * accurate, and it's the only freshness signal Google accepts for these pages.
 */
export function lastModifiedFor(key: string): Date {
  const entry: TimestampEntry | undefined = dataTimestamps.entries[key];
  return entry ? new Date(entry.lastModified) : FALLBACK_LAST_MODIFIED;
}

/**
 * Newest lastModified across a set of keys — used for hub pages, which are only
 * as fresh as the freshest thing they link to.
 *
 * Seeded from `null`, NOT from the fallback: seeding with the fallback makes it
 * a floor rather than a fallback, so every hub would report the build date and
 * quietly reintroduce the "everything changed today" stamp this file exists to
 * remove. The fallback applies only when the prefix matches nothing at all.
 */
export function newestLastModified(prefix: string): Date {
  let newest: Date | null = null;
  for (const [key, entry] of Object.entries(dataTimestamps.entries)) {
    if (!key.startsWith(prefix)) continue;
    const date = new Date(entry.lastModified);
    if (newest === null || date > newest) newest = date;
  }
  return newest ?? FALLBACK_LAST_MODIFIED;
}

// changeFrequency and priority are deliberately absent everywhere: Google
// ignores both, and they dilute the one hint it does read.
export default function sitemap(): MetadataRoute.Sitemap {
  const gamesUpdated = newestLastModified("game:");
  const countriesUpdated = newestLastModified("country:");
  const categoriesUpdated = newestLastModified("category:");
  const listsUpdated = newestLastModified("list:");

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: gamesUpdated > countriesUpdated ? gamesUpdated : countriesUpdated,
    },
    { url: `${BASE_URL}/games`, lastModified: gamesUpdated },
    { url: `${BASE_URL}/countries`, lastModified: countriesUpdated },
    { url: `${BASE_URL}/categories`, lastModified: categoriesUpdated },
    { url: `${BASE_URL}/lists`, lastModified: listsUpdated },
  ];

  // Category detail pages live here rather than in a shard — there are only 21
  // of them and /app/categories has no sitemap.ts of its own.
  const categoryPages: MetadataRoute.Sitemap = getAllCategories().map((cat) => ({
    url: `${BASE_URL}/categories/${cat.slug}`,
    lastModified: lastModifiedFor(`category:${cat.slug}`),
  }));

  return [...staticPages, ...categoryPages];
}
