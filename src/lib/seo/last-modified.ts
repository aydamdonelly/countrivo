import timestamps from "@/data/data-timestamps.json";

/**
 * The one source of "when did this page last change": the sitemaps' <lastmod> and the
 * pages' JSON-LD `dateModified` both read it, so the two can never disagree. Backed by
 * scripts/build-data-timestamps.ts, which only moves a date when the fingerprint of what
 * the page renders moves.
 */
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
 * "category:{slug}" / "list:{slug}" / "game:{slug}" / "practice:{slug}".
 *
 * Google discards <lastmod> that isn't verifiably accurate, and it's the only
 * freshness signal Google accepts for these pages.
 */
export function lastModifiedFor(key: string): Date {
  const entry: TimestampEntry | undefined = dataTimestamps.entries[key];
  return entry ? new Date(entry.lastModified) : FALLBACK_LAST_MODIFIED;
}

/**
 * Newest lastModified across a set of keys: used for hub pages, which are only
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

/** `dateModified` for JSON-LD: the same instant as the sitemap, as an ISO string. */
export function dateModifiedFor(key: string): string {
  return lastModifiedFor(key).toISOString();
}
