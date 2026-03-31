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

  const top3 = getTopCountries(slug, 3);
  const topNames = top3
    .map((t) => getCountryByIso3(t.iso3)?.displayName)
    .filter(Boolean)
    .join(", ");

  return {
    title: `${category.label} by Country — World Ranking`,
    description: `Which countries rank highest in ${category.label.toLowerCase()}? Full world ranking of all countries. Top 3: ${topNames}. Source: ${category.source} (${category.sourceYear}).`,
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

  const allCategories = getAllCategories();
  const topCountries = getTopCountries(slug, 300);
  const top3 = topCountries.slice(0, 3);

  // JSON-LD for the leaderboard
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.label} — World Ranking`,
    description: `Countries ranked by ${category.label.toLowerCase()}`,
    numberOfItems: topCountries.length,
    itemListElement: topCountries.slice(0, 10).map(({ iso3, rank }) => {
      const country = getCountryByIso3(iso3);
      return {
        "@type": "ListItem",
        position: rank,
        name: country?.displayName ?? iso3,
        url: `https://countrivo.com/countries/${country?.slug}`,
      };
    }),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/categories"
        className="inline-flex items-center gap-1 text-sm text-cream-muted hover:text-gold transition-colors mb-6"
      >
        ← All rankings
      </Link>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-3">
          <span className="text-5xl">{category.emoji}</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            {category.label} by Country
          </h1>
        </div>
        <p className="text-cream-muted text-lg max-w-3xl">{category.description}</p>
        <p className="text-sm text-cream-muted mt-2">
          Source: {category.source} ({category.sourceYear}) &middot; {topCountries.length} countries ranked
        </p>
      </div>

      {/* Top 3 highlight cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {top3.map(({ iso3, rank }, i) => {
          const country = getCountryByIso3(iso3);
          if (!country) return null;
          const value = getStatValue(iso3, slug);
          const medals = ["🥇", "🥈", "🥉"];
          return (
            <Link
              key={iso3}
              href={`/countries/${country.slug}`}
              className="game-card p-6 border border-border bg-surface text-center group"
            >
              <span className="text-3xl">{medals[i]}</span>
              <span className="text-5xl block mt-2">{country.flagEmoji}</span>
              <h3 className="text-xl font-extrabold mt-3 group-hover:text-gold transition-colors">
                {country.displayName}
              </h3>
              <p className="text-lg font-mono text-cream-muted mt-1">
                {value !== null ? formatStat(value, category.unit) : "—"}
              </p>
              <p className="text-sm text-cream-muted mt-1">#{rank} worldwide</p>
            </Link>
          );
        })}
      </div>

      {/* Full leaderboard */}
      <section>
        <h2 className="text-2xl font-extrabold mb-4">Full World Ranking</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full">
            <thead>
              <tr className="bg-surface text-left text-sm">
                <th className="px-4 py-3 font-bold w-16 text-right">Rank</th>
                <th className="px-4 py-3 font-bold">Country</th>
                <th className="px-4 py-3 font-bold text-right">{category.label}</th>
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
                    className="border-t border-border hover:bg-surface/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-right tabular-nums text-cream-muted font-bold">
                      {rank}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/countries/${country.slug}`}
                        className="inline-flex items-center gap-2.5 hover:text-gold transition-colors"
                      >
                        <span className="text-xl shrink-0">{country.flagEmoji}</span>
                        <span className="font-medium">{country.displayName}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono">
                      {value !== null ? formatStat(value, category.unit) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Cross-links to other categories */}
      <section className="mt-16 pt-12 border-t border-border">
        <h2 className="text-xl font-extrabold mb-4">More Rankings</h2>
        <div className="flex flex-wrap gap-2">
          {allCategories
            .filter((c) => c.slug !== slug)
            .slice(0, 12)
            .map((c) => (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg text-sm hover:border-border transition-colors"
              >
                <span>{c.emoji}</span>
                <span>{c.label}</span>
              </Link>
            ))}
        </div>
      </section>

      {/* Game cross-links */}
      <section className="mt-12">
        <h2 className="text-xl font-extrabold mb-4">Test Your Knowledge</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link href="/games/country-draft" className="game-card p-5 border border-border bg-surface text-center">
            <span className="text-3xl block mb-2">🎯</span>
            <span className="text-sm font-bold">Country Draft</span>
          </Link>
          <Link href="/games/higher-or-lower" className="game-card p-5 border border-border bg-surface text-center">
            <span className="text-3xl block mb-2">⬆️</span>
            <span className="text-sm font-bold">Higher or Lower</span>
          </Link>
          <Link href="/games/population-sort" className="game-card p-5 border border-border bg-surface text-center">
            <span className="text-3xl block mb-2">📊</span>
            <span className="text-sm font-bold">Population Sort</span>
          </Link>
          <Link href="/games/stat-guesser" className="game-card p-5 border border-border bg-surface text-center">
            <span className="text-3xl block mb-2">🔢</span>
            <span className="text-sm font-bold">Stat Guesser</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
