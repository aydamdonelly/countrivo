import type { MetadataRoute } from "next";
import { getAllCountries } from "@/lib/data/countries";
import { BASE_URL, lastModifiedFor } from "@/app/sitemap";

// Shard: https://countrivo.com/countries/sitemap.xml (243 country detail pages).
export default function sitemap(): MetadataRoute.Sitemap {
  return getAllCountries().map((country) => ({
    url: `${BASE_URL}/countries/${country.slug}`,
    lastModified: lastModifiedFor(`country:${country.slug}`),
  }));
}
