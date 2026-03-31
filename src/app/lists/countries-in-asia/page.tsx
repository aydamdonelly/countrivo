import type { Metadata } from "next";
import Link from "next/link";
import { getCountriesByContinent } from "@/lib/data/countries";
import { getStatValue } from "@/lib/data/ranks";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "All Countries in Asia — Complete List with Stats",
  description:
    "Complete list of every country in Asia with flag, capital, population, and area. From China and India to Singapore and Maldives.",
};

export default function CountriesInAsiaPage() {
  const countries = getCountriesByContinent("Asia");
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
        All Countries in Asia
      </h1>

      <div className="mt-6 max-w-3xl space-y-4 text-cream-muted leading-relaxed">
        <p>
          Asia is the world&apos;s largest and most populous continent, home to
          {" "}{countries.length} countries and territories. It stretches from Turkey
          and the Middle East in the west to Japan and Indonesia in the east,
          encompassing an extraordinary diversity of cultures, languages, and
          landscapes.
        </p>
        <p>
          The continent contains the two most populated countries on
          Earth — India and China — as well as some of the wealthiest nations per
          capita, including Singapore, Qatar, and the United Arab Emirates. Asia
          also includes vast, sparsely populated regions like Mongolia and
          Kazakhstan.
        </p>
        <p>
          Below is the complete list of Asian countries sorted by population, with
          each nation&apos;s capital, population, and total area included for
          reference.
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
          How well do you know Asian geography? Try these free games.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/games/continent-sprint"
            className="px-4 py-2 bg-gold-dim text-gold font-semibold rounded-lg hover:bg-gold hover:text-bg transition-colors"
          >
            Continent Sprint
          </Link>
          <Link
            href="/games/flag-quiz"
            className="px-4 py-2 bg-gold-dim text-gold font-semibold rounded-lg hover:bg-gold hover:text-bg transition-colors"
          >
            Flag Quiz
          </Link>
          <Link
            href="/games/capital-match"
            className="px-4 py-2 bg-gold-dim text-gold font-semibold rounded-lg hover:bg-gold hover:text-bg transition-colors"
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
            href="/lists/countries-in-africa"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Countries in Africa
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
