import type { MetadataRoute } from "next";
import { getAllCountries } from "@/lib/data/countries";
import { getAllCategories } from "@/lib/data/categories";
import { getAllGames } from "@/lib/data/games";

const BASE_URL = "https://countrivo.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/games`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/countries`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/categories`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/lists`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];

  // Long-tail list pages
  const listPages: MetadataRoute.Sitemap = [
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
  ].map((slug) => ({
    url: `${BASE_URL}/lists/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const gamePages: MetadataRoute.Sitemap = getAllGames().map((game) => ({
    url: `${BASE_URL}${game.route}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const countryPages: MetadataRoute.Sitemap = getAllCountries().map((country) => ({
    url: `${BASE_URL}/countries/${country.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const categoryPages: MetadataRoute.Sitemap = getAllCategories().map((cat) => ({
    url: `${BASE_URL}/categories/${cat.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...listPages, ...gamePages, ...countryPages, ...categoryPages];
}
