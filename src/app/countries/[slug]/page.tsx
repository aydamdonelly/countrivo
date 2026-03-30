import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllCountries, getCountryBySlug } from "@/lib/data/countries";
import { getRanksForCountry, getStatValue } from "@/lib/data/ranks";
import { getAllCategories } from "@/lib/data/categories";
import { formatStat, ordinal } from "@/lib/utils";

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

  return {
    title: `${country.flagEmoji} ${country.displayName}`,
    description: `Explore ${country.displayName} — capital, region, and world rankings across ${getAllCategories().length}+ statistics.`,
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Back link */}
      <Link
        href="/countries"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-brand transition-colors mb-6"
      >
        &larr; All countries
      </Link>

      {/* Header */}
      <div className="flex items-center gap-5 mb-10">
        <span className="text-6xl shrink-0">{country.flagEmoji}</span>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {country.displayName}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-text-muted">
            <span>{country.continent}</span>
            <span className="hidden sm:inline">&middot;</span>
            <span>{country.region}</span>
            {country.capital && (
              <>
                <span className="hidden sm:inline">&middot;</span>
                <span>Capital: {country.capital}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats table */}
      <section>
        <h2 className="text-xl font-bold mb-4">World Rankings</h2>
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
                      {value !== null ? formatStat(value, cat.unit) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {rank !== undefined ? ordinal(rank) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
