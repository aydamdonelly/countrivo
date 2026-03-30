import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllCountries,
  getCountryBySlug,
  getCountryByIso3,
  getCountriesByContinent,
} from "@/lib/data/countries";
import { getRanksForCountry, getStatValue } from "@/lib/data/ranks";
import { getAllCategories } from "@/lib/data/categories";
import { getCategoryBySlug } from "@/lib/data/categories";
import { getAllGames } from "@/lib/data/games";
import { formatStat, ordinal, formatNumber } from "@/lib/utils";
import bordersData from "@/data/borders.json";

const borders: Record<string, string[]> = bordersData;

export async function generateStaticParams() {
  return getAllCountries().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const country = getCountryBySlug(slug);
  if (!country) return {};

  const ranks = getRanksForCountry(country.iso3);
  const categories = getAllCategories();
  const topRanks = Object.entries(ranks)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 3);

  const highlights = topRanks
    .map(([catSlug, rank]) => {
      const cat = getCategoryBySlug(catSlug);
      return cat ? `${ordinal(rank)} in ${cat.label}` : null;
    })
    .filter(Boolean)
    .join(", ");

  const capitalPart = country.capital
    ? ` Its capital is ${country.capital}.`
    : "";

  return {
    title: `${country.displayName} — Country Stats, Rankings & Facts`,
    description: `${country.displayName} is a country in ${country.continent}.${capitalPart} Top rankings: ${highlights}. Explore ${categories.length}+ statistics and world rankings.`,
    openGraph: {
      title: `${country.displayName} — Country Stats, Rankings & Facts`,
      description: `Explore detailed statistics and world rankings for ${country.displayName}.`,
      type: "website",
    },
  };
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const country = getCountryBySlug(slug);
  if (!country) notFound();

  const categories = getAllCategories();
  const ranks = getRanksForCountry(country.iso3);
  const games = getAllGames();

  // Top 3 best rankings for highlight cards
  const topRanks = Object.entries(ranks)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 3)
    .map(([catSlug, rank]) => {
      const cat = getCategoryBySlug(catSlug);
      const value = getStatValue(country.iso3, catSlug);
      return cat ? { cat, rank, value } : null;
    })
    .filter(Boolean) as { cat: (typeof categories)[number]; rank: number; value: number | null }[];

  // Neighboring countries
  const borderIso3s = borders[country.iso3] ?? [];
  const neighborCountries = borderIso3s
    .map((iso3) => getCountryByIso3(iso3))
    .filter(Boolean) as NonNullable<ReturnType<typeof getCountryByIso3>>[];

  // Countries in the same continent
  const continentCountries = getCountriesByContinent(country.continent)
    .filter((c) => c.iso3 !== country.iso3)
    .slice(0, 12);

  // Build the description for JSON-LD
  const capitalDesc = country.capital
    ? ` Its capital is ${country.capital}.`
    : "";
  const jsonLdDescription = `${country.displayName} is a country located in ${country.subregion}, ${country.continent}.${capitalDesc}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Country",
    name: country.displayName,
    alternateName: country.iso3,
    description: jsonLdDescription,
    containedInPlace: {
      "@type": "Continent",
      name: country.continent,
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Back link */}
      <Link
        href="/countries"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-brand transition-colors mb-8"
      >
        &larr; All countries
      </Link>

      {/* Hero section */}
      <header className="mb-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <span className="text-8xl shrink-0 leading-none" aria-hidden="true">
            {country.flagEmoji}
          </span>
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              {country.displayName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-base text-text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="font-medium text-text">Continent:</span>
                {country.continent}
              </span>
              <span className="text-border">|</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="font-medium text-text">Region:</span>
                {country.subregion}
              </span>
              {country.capital && (
                <>
                  <span className="text-border">|</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="font-medium text-text">Capital:</span>
                    {country.capital}
                  </span>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-text-muted">
              <span>ISO 3166-1 alpha-2: {country.iso2}</span>
              <span className="text-border">|</span>
              <span>ISO 3166-1 alpha-3: {country.iso3}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Quick stats highlights */}
      {topRanks.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Top Rankings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topRanks.map(({ cat, rank, value }) => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="flex items-start gap-4 rounded-xl border border-border bg-surface p-5 hover:border-brand/50 hover:bg-surface-muted/50 transition-colors"
              >
                <span className="text-3xl shrink-0">{cat.emoji}</span>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tabular-nums text-brand">
                    #{rank}
                  </p>
                  <p className="text-sm font-medium truncate">{cat.label}</p>
                  {value !== null && (
                    <p className="text-xs text-text-muted mt-0.5 tabular-nums">
                      {formatStat(value, cat.unit)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Full stats table */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">
          All Statistics &amp; World Rankings
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-muted text-left">
                <th className="px-4 py-3 font-semibold">Stat</th>
                <th className="px-4 py-3 font-semibold text-right">Value</th>
                <th className="px-4 py-3 font-semibold text-right">
                  World Rank
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const value = getStatValue(country.iso3, cat.slug);
                const rank = ranks[cat.slug];

                return (
                  <tr
                    key={cat.slug}
                    className="border-t border-border hover:bg-surface-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/categories/${cat.slug}`}
                        className="hover:text-brand transition-colors"
                      >
                        <span className="mr-2">{cat.emoji}</span>
                        {cat.label}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {value !== null ? formatStat(value, cat.unit) : "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {rank !== undefined ? ordinal(rank) : "\u2014"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Neighboring countries */}
      {neighborCountries.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Neighboring Countries</h2>
          <p className="text-text-muted mb-4">
            {country.displayName} shares a border with{" "}
            {neighborCountries.length}{" "}
            {neighborCountries.length === 1 ? "country" : "countries"}.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {neighborCountries.map((neighbor) => (
              <Link
                key={neighbor.iso3}
                href={`/countries/${neighbor.slug}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 hover:border-brand/50 hover:bg-surface-muted/50 transition-colors"
              >
                <span className="text-2xl shrink-0">{neighbor.flagEmoji}</span>
                <span className="text-sm font-medium truncate">
                  {neighbor.displayName}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Countries in the same continent */}
      {continentCountries.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            More Countries in {country.continent}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {continentCountries.map((related) => (
              <Link
                key={related.iso3}
                href={`/countries/${related.slug}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 hover:border-brand/50 hover:bg-surface-muted/50 transition-colors"
              >
                <span className="text-2xl shrink-0">{related.flagEmoji}</span>
                <span className="text-sm font-medium truncate">
                  {related.displayName}
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-4">
            <Link
              href="/countries"
              className="text-sm text-brand hover:underline"
            >
              View all countries &rarr;
            </Link>
          </div>
        </section>
      )}

      {/* Play games about this country */}
      {games.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            Play Games About Countries
          </h2>
          <p className="text-text-muted mb-4">
            Test your knowledge of {country.displayName} and other countries
            around the world.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {games.map((game) => (
              <Link
                key={game.slug}
                href={game.route}
                className="flex items-start gap-4 rounded-xl border border-border bg-surface p-5 hover:border-brand/50 hover:bg-surface-muted/50 transition-colors"
              >
                <span className="text-3xl shrink-0">{game.emoji}</span>
                <div className="min-w-0">
                  <p className="font-semibold">{game.title}</p>
                  <p className="text-sm text-text-muted mt-0.5 line-clamp-2">
                    {game.shortDescription}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
