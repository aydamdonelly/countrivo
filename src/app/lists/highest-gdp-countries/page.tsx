import type { Metadata } from "next";
import Link from "next/link";
import { getTopCountries, getStatValue } from "@/lib/data/ranks";
import { getCountryByIso3 } from "@/lib/data/countries";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Largest Economies in the World by GDP (2024)",
  description:
    "The 50 largest economies in the world ranked by total GDP in US dollars. USA, China, and Germany lead.",
  alternates: { canonical: "https://countrivo.com/lists/highest-gdp-countries" },
};

export default function HighestGdpCountriesPage() {
  const top = getTopCountries("gdp", 50);
  const rows = top.map(({ iso3, rank }) => {
    const country = getCountryByIso3(iso3);
    const value = getStatValue(iso3, "gdp");
    return { country, rank, value };
  });

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://countrivo.com"},
          {"@type": "ListItem", "position": 2, "name": "Lists", "item": "https://countrivo.com/lists"},
          {"@type": "ListItem", "position": 3, "name": "Largest Economies by GDP", "item": "https://countrivo.com/lists/highest-gdp-countries"}
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Which country has the highest GDP in the world?",
            "acceptedAnswer": {"@type": "Answer", "text": "The United States has the highest GDP in the world, exceeding $25 trillion. The US economy is driven by technology, finance, healthcare, and consumer spending."}
          },
          {
            "@type": "Question",
            "name": "What are the top 5 largest economies by GDP?",
            "acceptedAnswer": {"@type": "Answer", "text": "The 5 largest economies by GDP are: 1. United States ($25T+), 2. China ($18T+), 3. Germany ($4T+), 4. Japan ($4T+), 5. India ($3.5T+)."}
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
        Largest Economies in the World by GDP
      </h1>

      <div className="mt-6 max-w-3xl space-y-4 text-cream-muted leading-relaxed">
        <p>
          The United States economy exceeds $25 trillion, making it the largest
          in the world by total GDP. China is the world&apos;s second-largest
          economy, and together the top 10 economies produce over 65% of global
          GDP.
        </p>
        <p>
          GDP (Gross Domestic Product) measures the total value of goods and
          services produced within a country in a given year. It is the most
          widely used indicator of economic size, though it does not capture
          income distribution or quality of life.
        </p>
        <p>
          The USA and China together represent roughly 40% of world GDP, while
          India is the fastest-growing large economy. This ranking uses nominal
          GDP in current US dollars from World Bank data.
        </p>
      </div>

      {/* Fun facts */}
      <div className="mt-10 bg-surface border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold mb-3">Quick Facts</h2>
        <ul className="space-y-2 text-sm text-cream-muted">
          <li>USA and China together represent roughly 40% of world GDP.</li>
          <li>India is the fastest-growing large economy in the world.</li>
          <li>The top 10 economies produce over 65% of global GDP.</li>
          <li>GDP per capita tells a very different story — see our Richest Countries list.</li>
        </ul>
      </div>

      {/* Table */}
      <div className="mt-10 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-sm text-cream-muted">
              <th className="py-3 pr-4 font-semibold w-16">Rank</th>
              <th className="py-3 pr-4 font-semibold">Country</th>
              <th className="py-3 font-semibold text-right">GDP (USD)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ country, rank, value }) => {
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
                    {value !== null ? formatNumber(value) : "—"}
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
          Can you rank the world&apos;s largest economies from memory? Try these geography games.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/games/higher-or-lower"
            className="px-4 py-2 bg-gold-dim text-gold font-semibold rounded-lg hover:bg-gold hover:text-bg transition-colors"
          >
            Higher or Lower
          </Link>
          <Link
            href="/games/country-draft"
            className="px-4 py-2 bg-gold-dim text-gold font-semibold rounded-lg hover:bg-gold hover:text-bg transition-colors"
          >
            Country Draft
          </Link>
          <Link
            href="/games/flag-quiz"
            className="px-4 py-2 bg-gold-dim text-gold font-semibold rounded-lg hover:bg-gold hover:text-bg transition-colors"
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
            href="/lists/richest-countries"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Richest Countries (GDP per Capita)
          </Link>
          <Link
            href="/lists/most-populated-countries"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Most Populated Countries
          </Link>
          <Link
            href="/lists/biggest-military-spenders"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Biggest Military Spenders
          </Link>
          <Link
            href="/lists/most-visited-countries"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Most Visited Countries
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
