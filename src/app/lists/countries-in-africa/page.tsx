import type { Metadata } from "next";
import Link from "next/link";
import { getCountriesByContinent } from "@/lib/data/countries";
import { getStatValue } from "@/lib/data/ranks";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "All Countries in Africa — Complete List with Stats",
  description:
    "Complete list of every country in Africa with flag, capital, population, and area. 54 nations from Nigeria to Seychelles.",
};

export default function CountriesInAfricaPage() {
  const countries = getCountriesByContinent("Africa");
  const rows = countries
    .map((country) => ({
      country,
      population: getStatValue(country.iso3, "population"),
      area: getStatValue(country.iso3, "area-km2"),
    }))
    .sort((a, b) => {
      const popA = a.population ?? 0;
      const popB = b.population ?? 0;
      return popB - popA;
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
        All Countries in Africa
      </h1>

      <div className="mt-6 max-w-3xl space-y-4 text-cream-muted leading-relaxed">
        <p>
          Africa is the second-largest continent in both area and population,
          comprising {countries.length} countries and territories. It spans from
          the Mediterranean coastline of Morocco and Egypt in the north to the
          southern tip of South Africa, covering over 30 million square
          kilometers.
        </p>
        <p>
          Nigeria is Africa&apos;s most populous nation with over 220 million
          people, and the continent&apos;s population is the youngest and
          fastest-growing in the world. By 2050, Africa is expected to be home to
          roughly a quarter of the global population.
        </p>
        <p>
          The continent holds tremendous geographic diversity: the Sahara
          Desert in the north, the Congo rainforest in Central Africa, the Great
          Rift Valley in East Africa, and the savannas and wildlife reserves that
          draw visitors from around the globe. Below is the complete list of
          African countries sorted by population.
        </p>
      </div>

      <p className="mt-6 text-sm text-cream-muted">
        {countries.length} countries and territories
      </p>

      {/* Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-sm text-cream-muted">
              <th className="py-3 pr-4 font-semibold">Country</th>
              <th className="py-3 pr-4 font-semibold">Capital</th>
              <th className="py-3 pr-4 font-semibold text-right">Population</th>
              <th className="py-3 font-semibold text-right">Area (km²)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ country, population, area }) => (
              <tr
                key={country.iso3}
                className="border-b border-border/50 hover:bg-surface/50 transition-colors"
              >
                <td className="py-3 pr-4">
                  <Link
                    href={`/countries/${country.slug}`}
                    className="inline-flex items-center gap-2 font-medium hover:text-gold transition-colors"
                  >
                    <span className="text-lg shrink-0">{country.flagEmoji}</span>
                    {country.displayName}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-cream-muted text-sm">
                  {country.capital || "—"}
                </td>
                <td className="py-3 pr-4 text-right font-mono text-sm">
                  {population !== null ? formatNumber(population) : "—"}
                </td>
                <td className="py-3 text-right font-mono text-sm">
                  {area !== null ? formatNumber(area) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Game CTAs */}
      <div className="mt-12 bg-surface border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold mb-2">Test Your Knowledge</h2>
        <p className="text-sm text-cream-muted mb-4">
          Can you name every African country? Challenge yourself with these games.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/games/continent-sprint"
            className="px-4 py-2 bg-gold-dim text-gold font-semibold rounded-lg hover:bg-gold hover:text-white transition-colors"
          >
            Continent Sprint
          </Link>
          <Link
            href="/games/flag-quiz"
            className="px-4 py-2 bg-gold-dim text-gold font-semibold rounded-lg hover:bg-gold hover:text-white transition-colors"
          >
            Flag Quiz
          </Link>
          <Link
            href="/games/capital-match"
            className="px-4 py-2 bg-gold-dim text-gold font-semibold rounded-lg hover:bg-gold hover:text-white transition-colors"
          >
            Capital Match
          </Link>
        </div>
      </div>

      {/* See also */}
      <div className="mt-12 pt-8 border-t border-border">
        <h2 className="text-lg font-bold mb-4">See Also</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/lists/countries-in-europe"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Countries in Europe
          </Link>
          <Link
            href="/lists/countries-in-asia"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Countries in Asia
          </Link>
          <Link
            href="/lists/countries-in-americas"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Countries in the Americas
          </Link>
          <Link
            href="/lists/largest-countries"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Largest Countries by Area
          </Link>
          <Link
            href="/lists/most-populated-countries"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Most Populated Countries
          </Link>
        </div>
      </div>
    </div>
  );
}
