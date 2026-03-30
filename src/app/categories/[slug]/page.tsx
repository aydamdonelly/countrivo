import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllCategories, getCategoryBySlug } from "@/lib/data/categories";
import { getTopCountries, getStatValue } from "@/lib/data/ranks";
import { getCountryByIso3 } from "@/lib/data/countries";
import { formatStat } from "@/lib/utils";

export async function generateStaticParams() {
  return getAllCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: `${category.emoji} ${category.label} — World Rankings`,
    description: `Global leaderboard for ${category.label.toLowerCase()}. See which countries rank highest and compare values worldwide.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const topCountries = getTopCountries(slug, 300);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Back link */}
      <Link
        href="/categories"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-brand transition-colors mb-6"
      >
        &larr; All categories
      </Link>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl shrink-0">{category.emoji}</span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {category.label}
          </h1>
        </div>
        <p className="text-text-muted max-w-2xl">{category.description}</p>
        <p className="text-xs text-text-muted mt-2">
          Source: {category.source} ({category.sourceYear})
        </p>
      </div>

      {/* Leaderboard */}
      <section>
        <h2 className="text-xl font-bold mb-4">World Leaderboard</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-muted text-left">
                <th className="px-4 py-3 font-semibold w-16 text-right">
                  Rank
                </th>
                <th className="px-4 py-3 font-semibold">Country</th>
                <th className="px-4 py-3 font-semibold text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {topCountries.map(({ iso3, rank }) => {
                const country = getCountryByIso3(iso3);
                if (!country) return null;

                const value = getStatValue(iso3, slug);

                return (
                  <tr
                    key={iso3}
                    className="border-t border-border hover:bg-surface-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-right tabular-nums text-text-muted">
                      {rank}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/countries/${country.slug}`}
                        className="inline-flex items-center gap-2 hover:text-brand transition-colors"
                      >
                        <span className="text-lg shrink-0">
                          {country.flagEmoji}
                        </span>
                        {country.displayName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {value !== null ? formatStat(value, category.unit) : "—"}
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
