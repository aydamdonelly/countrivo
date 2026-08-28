import type { MetadataRoute } from "next";
import { BASE_URL, lastModifiedFor } from "@/app/sitemap";

// Long-tail list pages — static routes, so the slugs live here by hand.
const LIST_SLUGS = [
  "largest-countries",
  "most-populated-countries",
  "richest-countries",
  "countries-in-europe",
  "countries-in-asia",
  "countries-in-africa",
  "countries-in-americas",
  "most-visited-countries",
  "highest-life-expectancy",
  "highest-gdp-countries",
  "most-forested-countries",
  "most-connected-countries",
  "highest-fertility-rate",
  "biggest-military-spenders",
  "greenest-countries",
];

// Shard: https://countrivo.com/lists/sitemap.xml
export default function sitemap(): MetadataRoute.Sitemap {
  return LIST_SLUGS.map((slug) => ({
    url: `${BASE_URL}/lists/${slug}`,
    lastModified: lastModifiedFor(`list:${slug}`),
  }));
}
