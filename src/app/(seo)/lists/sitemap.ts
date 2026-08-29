import type { MetadataRoute } from "next";
import { LISTS } from "@/content/lists";
import { BASE_URL, lastModifiedFor } from "@/app/sitemap";

// Shard: https://countrivo.com/lists/sitemap.xml
// The slugs come from src/content/lists.ts, the one source the hub, the 15 pages
// and scripts/build-data-timestamps.ts all read, so a list can never exist on the
// site and be missing from the sitemap (blueprint 7.12).
export default function sitemap(): MetadataRoute.Sitemap {
  return LISTS.map((list) => ({
    url: `${BASE_URL}/lists/${list.slug}`,
    lastModified: lastModifiedFor(`list:${list.slug}`),
  }));
}
