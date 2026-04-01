import type { Metadata } from "next";
import Link from "next/link";
import { getCountriesByContinent } from "@/lib/data/countries";
import { getStatValue } from "@/lib/data/ranks";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "All Countries in Europe — Complete List with Stats",
  description:
    "Complete list of every country in Europe with flag, capital, population, and area. From tiny Vatican City to vast Russia's European territory.",
  alternates: { canonical: "https://countrivo.com/lists/countries-in-europe" },
};

export default function CountriesInEuropePage() {
  const countries = getCountriesByContinent("Europe");
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

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://countrivo.com"},
          {"@type": "ListItem", "position": 2, "name": "Lists", "item": "https://countrivo.com/lists"},
          {"@type": "ListItem", "position": 3, "name": "Countries in Europe", "item": "https://countrivo.com/lists/countries-in-europe"}
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How many countries are there in Europe?",
            "acceptedAnswer": {"@type": "Answer", "text": "There are 44 countries in Europe, ranging from Russia (the largest by area) to Vatican City (the smallest independent state in the world)."}
          },
          {
            "@type": "Question",
            "name": "What is the most populated country in Europe?",
            "acceptedAnswer": {"@type": "Answer", "text": "Russia is the most populated country in Europe with approximately 145 million people, followed by Germany with about 84 million."}
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Link
        href="/lists"
        className="text-sm font-medium text-gold hover:text-gold transition-colors"
      >
        ← All Lists
      </Link>

      <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight">
        All Countries in Europe
      </h1>

      <div className="mt-6 max-w-3xl space-y-4 text-cream-muted leading-relaxed">
        <p>
          Europe is home to {countries.length} countries and territories, ranging
          from the vast expanse of Russia&apos;s European portion to microstates
          like Vatican City and Monaco. Despite being the second-smallest
          continent by area, Europe has played an outsized role in world history,
          economics, and culture.
        </p>
        <p>
          The European Union unites 27 of these nations under shared economic and
          political frameworks, while others — like Norway, Switzerland, and the
          United Kingdom — maintain close ties but operate independently.
          Combined, European countries produce roughly a quarter of global GDP.
        </p>
        <p>
          Below is the full list of European countries sorted by population, along
          with each nation&apos;s capital city, total population, and geographic
          area.
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
          How many European countries can you name? Try these geography games.
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
          <Link
            href="/lists/countries-in-americas"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Countries in the Americas
          </Link>
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
        </div>
      </div>
    </div>
    </>
  );
}
