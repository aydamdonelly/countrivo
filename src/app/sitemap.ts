import type { MetadataRoute } from "next";
import { getAllCategories } from "@/lib/data/categories";
import { PRACTICE_PAGES } from '@/lib/seo/practice-pages';
import { lastModifiedFor, newestLastModified } from "@/lib/seo/last-modified";

export const BASE_URL = "https://countrivo.com";

// The date helpers live in src/lib/seo/last-modified.ts so the pages' JSON-LD
// `dateModified` reads the same source; re-exported for the sitemap shards.
export { lastModifiedFor, newestLastModified };

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
    { url: `${BASE_URL}/practice`, lastModified: lastModifiedFor('practice:hub') },
    ...PRACTICE_PAGES.map(slug => ({ url: `${BASE_URL}/practice/${slug}`, lastModified: lastModifiedFor(`practice:${slug}`) })),
  ];

  // Category detail pages live here rather than in a shard: there are only 21
  // of them and /app/categories has no sitemap.ts of its own.
  const categoryPages: MetadataRoute.Sitemap = getAllCategories().map((cat) => ({
    url: `${BASE_URL}/categories/${cat.slug}`,
    lastModified: lastModifiedFor(`category:${cat.slug}`),
  }));

  return [...staticPages, ...categoryPages];
}
