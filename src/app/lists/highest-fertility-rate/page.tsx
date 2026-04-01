import type { Metadata } from "next";
import Link from "next/link";
import { getTopCountries, getStatValue } from "@/lib/data/ranks";
import { getCountryByIso3 } from "@/lib/data/countries";

export const metadata: Metadata = {
  title: "Highest Fertility Rates by Country | Birth Rate Ranking",
  description:
    "Countries ranked by fertility rate (births per woman). Sub-Saharan Africa leads while many developed nations are below replacement rate.",
  alternates: { canonical: "https://countrivo.com/lists/highest-fertility-rate" },
};

export default function HighestFertilityRatePage() {
  const top = getTopCountries("fertility-rate", 50);
  const rows = top.map(({ iso3, rank }) => {
    const country = getCountryByIso3(iso3);
    const value = getStatValue(iso3, "fertility-rate");
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
          {"@type": "ListItem", "position": 3, "name": "Highest Fertility Rate", "item": "https://countrivo.com/lists/highest-fertility-rate"}
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Which country has the highest fertility rate?",
            "acceptedAnswer": {"@type": "Answer", "text": "Niger has the highest fertility rate in the world, with approximately 7 births per woman. High fertility in Niger is driven by limited access to contraception, early marriage, and low female education rates."}
          },
          {
            "@type": "Question",
            "name": "What are the top 5 countries by fertility rate?",
            "acceptedAnswer": {"@type": "Answer", "text": "The top 5 countries by fertility rate are: 1. Niger (~7.0), 2. Chad (~6.4), 3. Somalia (~6.1), 4. Mali (~6.0), 5. DR Congo (~6.0) — all in Sub-Saharan Africa."}
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
        Countries with Highest Fertility Rate
      </h1>

      <div className="mt-6 max-w-3xl space-y-4 text-cream-muted leading-relaxed">
        <p>
          Niger and Chad typically lead the world in fertility rates, with
          averages exceeding 6 births per woman. Sub-Saharan African countries
          dominate the top of this ranking, driven by a combination of
          cultural factors, limited access to contraception, and lower levels
          of female education.
        </p>
        <p>
          The global replacement rate is 2.1 births per woman — the level
          needed to maintain a stable population. Many European and East Asian
          countries now sit well below this threshold, leading to aging
          populations and shrinking workforces.
        </p>
        <p>
          This ranking uses total fertility rate data from the World Bank and
          the United Nations Population Division.
        </p>
      </div>

      {/* Fun facts */}
      <div className="mt-10 bg-surface border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold mb-3">Quick Facts</h2>
        <ul className="space-y-2 text-sm text-cream-muted">
          <li>Niger has the highest fertility rate at approximately 7 births per woman.</li>
          <li>The replacement rate is 2.1 births per woman.</li>
          <li>Many European and East Asian countries are far below replacement rate.</li>
          <li>Global fertility has declined from 5.0 in 1960 to roughly 2.3 today.</li>
        </ul>
      </div>

      {/* Table */}
      <div className="mt-10 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-sm text-cream-muted">
              <th className="py-3 pr-4 font-semibold w-16">Rank</th>
              <th className="py-3 pr-4 font-semibold">Country</th>
              <th className="py-3 font-semibold text-right">Births per Woman</th>
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
                    {value !== null ? value?.toFixed(2) : "—"}
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
          Can you guess which countries have the highest birth rates? Try these geography games.
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
            href="/lists/most-populated-countries"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Most Populated Countries
          </Link>
          <Link
            href="/lists/highest-life-expectancy"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Highest Life Expectancy
          </Link>
          <Link
            href="/lists/countries-in-africa"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Countries in Africa
          </Link>
          <Link
            href="/lists/countries-in-asia"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Countries in Asia
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
