import type { Metadata } from "next";
import Link from "next/link";
import { getTopCountries, getStatValue } from "@/lib/data/ranks";
import { getCountryByIso3 } from "@/lib/data/countries";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Largest Countries in the World by Area — 2024 Ranking",
  description:
    "Ranked list of the 50 largest countries in the world by total area in km². From Russia to Bangladesh, see how big each nation really is.",
};

export default function LargestCountriesPage() {
  const top = getTopCountries("area-km2", 50);
  const rows = top.map(({ iso3, rank }) => {
    const country = getCountryByIso3(iso3);
    const area = getStatValue(iso3, "area-km2");
    return { country, rank, area };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Link
        href="/lists"
        className="text-sm font-medium text-gold hover:text-gold transition-colors"
      >
        ← All Lists
      </Link>

      <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight">
        Largest Countries in the World by Area
      </h1>

      <div className="mt-6 max-w-3xl space-y-4 text-cream-muted leading-relaxed">
        <p>
          The world&apos;s largest countries span entire continents. Russia alone
          covers over 17 million square kilometers — roughly 1.8 times the size of
          the second-largest country, Canada. Together, the top ten countries by
          area account for more than half of all the land on Earth.
        </p>
        <p>
          This ranking uses total area, which includes both land and inland water
          bodies such as lakes and rivers. Data is sourced from the World Bank and
          national geographic agencies.
        </p>
        <p>
          A country&apos;s size has profound effects on its climate diversity,
          natural resources, and logistical challenges. Brazil, for example,
          contains the world&apos;s largest tropical rainforest, while Australia&apos;s
          vast interior is predominantly arid desert.
        </p>
      </div>

      {/* Fun facts */}
      <div className="mt-10 bg-surface border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold mb-3">Quick Facts</h2>
        <ul className="space-y-2 text-sm text-cream-muted">
          <li>Russia is about 1.8x larger than Canada, the second-largest country.</li>
          <li>The top 3 countries (Russia, Canada, USA/China) each exceed 9 million km².</li>
          <li>Vatican City, the smallest country, could fit inside Russia over 38 billion times.</li>
          <li>Africa contains 6 of the 30 largest countries by area.</li>
        </ul>
      </div>

      {/* Table */}
      <div className="mt-10 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-sm text-cream-muted">
              <th className="py-3 pr-4 font-semibold w-16">Rank</th>
              <th className="py-3 pr-4 font-semibold">Country</th>
              <th className="py-3 font-semibold text-right">Area (km²)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ country, rank, area }) => {
              if (!country) return null;
              return (
                <tr
                  key={country.iso3}
                  className="border-b border-border/50 hover:bg-surface/50 transition-colors"
                >
                  <td className="py-3 pr-4 text-cream-muted font-mono text-sm">
                    {rank}
                  </td>
                  <td className="py-3 pr-4">
                    <Link
                      href={`/countries/${country.slug}`}
                      className="inline-flex items-center gap-2 font-medium hover:text-gold transition-colors"
                    >
                      <span className="text-lg shrink-0">{country.flagEmoji}</span>
                      {country.displayName}
                    </Link>
                  </td>
                  <td className="py-3 text-right font-mono text-sm">
                    {area !== null ? formatNumber(area) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Game CTAs */}
      <div className="mt-12 bg-surface border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold mb-2">Test Your Knowledge</h2>
        <p className="text-sm text-cream-muted mb-4">
          Can you rank countries by size from memory? Try these geography games.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/games/higher-or-lower"
            className="px-4 py-2 bg-gold-dim text-gold font-semibold rounded-lg hover:bg-gold hover:text-white transition-colors"
          >
            Higher or Lower
          </Link>
          <Link
            href="/games/country-draft"
            className="px-4 py-2 bg-gold-dim text-gold font-semibold rounded-lg hover:bg-gold hover:text-white transition-colors"
          >
            Country Draft
          </Link>
          <Link
            href="/games/flag-quiz"
            className="px-4 py-2 bg-gold-dim text-gold font-semibold rounded-lg hover:bg-gold hover:text-white transition-colors"
          >
            Flag Quiz
          </Link>
        </div>
      </div>

      {/* See also */}
      <div className="mt-12 pt-8 border-t border-border">
        <h2 className="text-lg font-bold mb-4">See Also</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/lists/most-populated-countries"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Most Populated Countries
          </Link>
          <Link
            href="/lists/richest-countries"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Richest Countries
          </Link>
          <Link
            href="/lists/countries-in-asia"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Countries in Asia
          </Link>
          <Link
            href="/lists/countries-in-africa"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Countries in Africa
          </Link>
        </div>
      </div>
    </div>
  );
}
