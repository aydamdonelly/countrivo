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
    title: `${country.displayName} | Stats, Rankings & Geography Facts`,
    description: `${country.displayName} is a country in ${country.continent}.${capitalPart} Top rankings: ${highlights}. Explore ${categories.length}+ statistics and world rankings.`,
    alternates: { canonical: `https://countrivo.com/countries/${slug}` },
    openGraph: {
      title: `${country.displayName} | Stats, Rankings & Geography Facts`,
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

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://countrivo.com" },
      { "@type": "ListItem", position: 2, name: "Countries", item: "https://countrivo.com/countries" },
      { "@type": "ListItem", position: 3, name: country.displayName, item: `https://countrivo.com/countries/${slug}` },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Back link */}
      <Link
        href="/countries"
        className="inline-flex items-center gap-1 text-sm text-cream-muted hover:text-gold transition-colors mb-8"
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
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-base text-cream-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="font-medium text-cream">Continent:</span>
                {country.continent}
              </span>
              <span className="text-border">|</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="font-medium text-cream">Region:</span>
                {country.subregion}
              </span>
              {country.capital && (
                <>
                  <span className="text-border">|</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="font-medium text-cream">Capital:</span>
                    {country.capital}
                  </span>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-cream-muted">
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
                className="flex items-start gap-4 rounded-xl border border-black/5 bg-white shadow-sm p-5 hover:border-black/10 hover:shadow transition-colors"
              >
                <span className="text-3xl shrink-0">{cat.emoji}</span>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tabular-nums text-gold">
                    #{rank}
                  </p>
                  <p className="text-sm font-medium truncate">{cat.label}</p>
                  {value !== null && (
                    <p className="text-xs text-cream-muted mt-0.5 tabular-nums">
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
              <tr className="bg-surface text-left">
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
                    className="border-t border-border hover:bg-surface/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/categories/${cat.slug}`}
                        className="hover:text-gold transition-colors"
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
          <p className="text-cream-muted mb-4">
            {country.displayName} shares a border with{" "}
            {neighborCountries.length}{" "}
            {neighborCountries.length === 1 ? "country" : "countries"}.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {neighborCountries.map((neighbor) => (
              <Link
                key={neighbor.iso3}
                href={`/countries/${neighbor.slug}`}
                className="flex items-center gap-3 rounded-xl border border-black/5 bg-white shadow-sm p-4 hover:border-black/10 hover:shadow transition-colors"
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
                className="flex items-center gap-3 rounded-xl border border-black/5 bg-white shadow-sm p-4 hover:border-black/10 hover:shadow transition-colors"
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
              className="text-sm text-gold hover:underline"
            >
              View all countries &rarr;
            </Link>
          </div>
        </section>
      )}

      {/* Play games featuring this country */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">
          Test Your Knowledge of {country.displayName}
        </h2>
        <p className="text-cream-muted mb-4">
          Think you know {country.displayName}? Challenge yourself with these geography games.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { href: "/games/flag-quiz", emoji: "🏁", title: "Flag Quiz", desc: `Can you identify ${country.displayName}'s flag?` },
            { href: "/games/higher-or-lower", emoji: "⬆️", title: "Higher or Lower", desc: `How does ${country.displayName} compare to other nations?` },
            { href: "/games/capital-match", emoji: "🏛️", title: "Capital Match", desc: `Do you know the capital of ${country.displayName}?` },
            { href: "/games/country-draft", emoji: "🎯", title: "Country Draft", desc: "Assign countries to their strongest stats" },
            { href: "/games/border-buddies", emoji: "🤝", title: "Border Buddies", desc: `Name all countries bordering ${country.displayName}` },
          ].map((game) => (
            <Link
              key={game.href}
              href={game.href}
              className="flex items-start gap-4 rounded-xl border border-black/5 bg-white shadow-sm p-5 hover:border-black/10 hover:shadow transition-colors"
            >
              <span className="text-3xl shrink-0">{game.emoji}</span>
              <div className="min-w-0">
                <p className="font-semibold">{game.title}</p>
                <p className="text-sm text-cream-muted mt-0.5">{game.desc}</p>
              </div>
            </Link>
          ))}
        </div>
        <Link
          href="/games"
          className="inline-block mt-4 text-sm text-gold hover:underline"
        >
          View all {games.length} games →
        </Link>
      </section>

      {/* Related lists */}
      <section className="mb-12 pt-8 border-t border-border">
        <h2 className="text-lg font-bold mb-4">Explore More Rankings</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/lists/most-populated-countries" className="px-4 py-2 bg-white border border-black/5 shadow-sm rounded-lg text-sm font-medium hover:border-black/10 transition-colors">
            Most Populated Countries
          </Link>
          <Link href="/lists/largest-countries" className="px-4 py-2 bg-white border border-black/5 shadow-sm rounded-lg text-sm font-medium hover:border-black/10 transition-colors">
            Largest Countries
          </Link>
          <Link href="/lists/richest-countries" className="px-4 py-2 bg-white border border-black/5 shadow-sm rounded-lg text-sm font-medium hover:border-black/10 transition-colors">
            Richest Countries
          </Link>
          <Link href="/categories" className="px-4 py-2 bg-white border border-black/5 shadow-sm rounded-lg text-sm font-medium text-gold hover:border-black/10 transition-colors">
            All Rankings →
          </Link>
        </div>
      </section>
    </div>
  );
}
