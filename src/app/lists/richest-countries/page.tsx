import type { Metadata } from "next";
import Link from "next/link";
import { getTopCountries, getStatValue } from "@/lib/data/ranks";
import { getCountryByIso3 } from "@/lib/data/countries";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Richest Countries in the World by GDP per Capita — 2024",
  description:
    "Ranked list of the 50 richest countries by GDP per capita in USD. Discover which nations have the highest economic output per person.",
};

export default function RichestCountriesPage() {
  const top = getTopCountries("gdp-per-capita", 50);
  const rows = top.map(({ iso3, rank }) => {
    const country = getCountryByIso3(iso3);
    const gdpPerCapita = getStatValue(iso3, "gdp-per-capita");
    return { country, rank, gdpPerCapita };
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
        Richest Countries in the World by GDP per Capita
      </h1>

      <div className="mt-6 max-w-3xl space-y-4 text-cream-muted leading-relaxed">
        <p>
          GDP per capita divides a country&apos;s total economic output by its
          population, giving a rough measure of average prosperity. Small nations
          with specialized economies — such as Luxembourg, Singapore, and
          Ireland — consistently rank near the top because their economic output
          is concentrated among a relatively small population.
        </p>
        <p>
          This ranking uses nominal GDP per capita in current US dollars, which
          makes it easy to compare across countries but does not adjust for local
          purchasing power. Countries with high costs of living may appear
          wealthier than they feel to residents.
        </p>
        <p>
          Oil-rich Gulf states like Qatar and the United Arab Emirates also rank
          highly, illustrating how natural resource wealth can inflate per-capita
          figures. Meanwhile, large advanced economies like the United States and
          Germany rank lower than some microstates despite having far greater total
          GDP.
        </p>
      </div>

      {/* Fun facts */}
      <div className="mt-10 bg-surface border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold mb-3">Quick Facts</h2>
        <ul className="space-y-2 text-sm text-cream-muted">
          <li>Luxembourg has held the top spot for GDP per capita for over a decade.</li>
          <li>Small financial hubs and city-states tend to dominate the top 10.</li>
          <li>GDP per capita does not measure inequality — a country can rank high while many residents earn far less than the average.</li>
          <li>Purchasing Power Parity (PPP) adjustments can significantly change these rankings.</li>
        </ul>
      </div>

      {/* Table */}
      <div className="mt-10 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-sm text-cream-muted">
              <th className="py-3 pr-4 font-semibold w-16">Rank</th>
              <th className="py-3 pr-4 font-semibold">Country</th>
              <th className="py-3 font-semibold text-right">GDP per Capita (USD)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ country, rank, gdpPerCapita }) => {
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
                    {gdpPerCapita !== null
                      ? `$${formatNumber(gdpPerCapita)}`
                      : "—"}
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
          Think you can guess which countries are wealthier? Try these games.
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
          <Link
            href="/lists/countries-in-europe"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Countries in Europe
          </Link>
          <Link
            href="/lists/countries-in-americas"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Countries in the Americas
          </Link>
        </div>
      </div>
    </div>
  );
}
