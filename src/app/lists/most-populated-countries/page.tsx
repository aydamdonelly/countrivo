import type { Metadata } from "next";
import Link from "next/link";
import { getTopCountries, getStatValue } from "@/lib/data/ranks";
import { getCountryByIso3 } from "@/lib/data/countries";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Most Populated Countries in the World — 2024 Ranking",
  description:
    "Ranked list of the 50 most populated countries in the world. See current population figures for India, China, the US, and more.",
};

export default function MostPopulatedCountriesPage() {
  const top = getTopCountries("population", 50);
  const rows = top.map(({ iso3, rank }) => {
    const country = getCountryByIso3(iso3);
    const population = getStatValue(iso3, "population");
    return { country, rank, population };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Link
        href="/lists"
        className="text-sm font-medium text-brand hover:text-brand-dark transition-colors"
      >
        ← All Lists
      </Link>

      <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight">
        Most Populated Countries in the World
      </h1>

      <div className="mt-6 max-w-3xl space-y-4 text-text-secondary leading-relaxed">
        <p>
          India overtook China as the world&apos;s most populated country in 2023,
          and both nations now have populations exceeding 1.4 billion people. The
          United States remains a distant third at roughly 340 million, followed by
          Indonesia and Pakistan.
        </p>
        <p>
          Population shapes every aspect of a nation&apos;s economy, politics, and
          infrastructure. Rapid growth in sub-Saharan Africa means several
          countries on this list — Nigeria, Ethiopia, the Democratic Republic of
          the Congo — are projected to climb even higher in the coming decades.
        </p>
        <p>
          The figures below reflect the most recent estimates available from the
          World Bank and United Nations Population Division. Total population
          includes all residents regardless of citizenship or legal status.
        </p>
      </div>

      {/* Fun facts */}
      <div className="mt-10 bg-surface-muted border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold mb-3">Quick Facts</h2>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li>India and China together account for over 35% of the world&apos;s population.</li>
          <li>The top 10 countries by population contain roughly 57% of all people on Earth.</li>
          <li>Nigeria is projected to become the third most populous country before 2050.</li>
          <li>Bangladesh is one of the most densely populated large countries, with over 170 million people in a relatively small area.</li>
        </ul>
      </div>

      {/* Table */}
      <div className="mt-10 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-sm text-text-muted">
              <th className="py-3 pr-4 font-semibold w-16">Rank</th>
              <th className="py-3 pr-4 font-semibold">Country</th>
              <th className="py-3 font-semibold text-right">Population</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ country, rank, population }) => {
              if (!country) return null;
              return (
                <tr
                  key={country.iso3}
                  className="border-b border-border/50 hover:bg-surface-muted/50 transition-colors"
                >
                  <td className="py-3 pr-4 text-text-muted font-mono text-sm">
                    {rank}
                  </td>
                  <td className="py-3 pr-4">
                    <Link
                      href={`/countries/${country.slug}`}
                      className="inline-flex items-center gap-2 font-medium hover:text-brand transition-colors"
                    >
                      <span className="text-lg shrink-0">{country.flagEmoji}</span>
                      {country.displayName}
                    </Link>
                  </td>
                  <td className="py-3 text-right font-mono text-sm">
                    {population !== null ? formatNumber(population) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Game CTAs */}
      <div className="mt-12 bg-surface-muted border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold mb-2">Test Your Knowledge</h2>
        <p className="text-sm text-text-secondary mb-4">
          Can you sort countries by population? Challenge yourself with these games.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/games/higher-or-lower"
            className="px-4 py-2 bg-brand/10 text-brand font-semibold rounded-lg hover:bg-brand hover:text-white transition-colors"
          >
            Higher or Lower
          </Link>
          <Link
            href="/games/country-draft"
            className="px-4 py-2 bg-brand/10 text-brand font-semibold rounded-lg hover:bg-brand hover:text-white transition-colors"
          >
            Country Draft
          </Link>
          <Link
            href="/games/flag-quiz"
            className="px-4 py-2 bg-brand/10 text-brand font-semibold rounded-lg hover:bg-brand hover:text-white transition-colors"
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
            href="/lists/largest-countries"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-brand/30 transition-colors"
          >
            Largest Countries by Area
          </Link>
          <Link
            href="/lists/richest-countries"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-brand/30 transition-colors"
          >
            Richest Countries
          </Link>
          <Link
            href="/lists/countries-in-asia"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-brand/30 transition-colors"
          >
            Countries in Asia
          </Link>
          <Link
            href="/lists/countries-in-europe"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-brand/30 transition-colors"
          >
            Countries in Europe
          </Link>
        </div>
      </div>
    </div>
  );
}
