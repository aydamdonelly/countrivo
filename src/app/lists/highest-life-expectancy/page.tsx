import type { Metadata } from "next";
import Link from "next/link";
import { getTopCountries, getStatValue } from "@/lib/data/ranks";
import { getCountryByIso3 } from "@/lib/data/countries";

export const metadata: Metadata = {
  title: "Highest Life Expectancy by Country (2024)",
  description:
    "Which countries have the longest life expectancy? Ranked list of 50 countries by average lifespan in years.",
  alternates: { canonical: "https://countrivo.com/lists/highest-life-expectancy" },
};

export default function HighestLifeExpectancyPage() {
  const top = getTopCountries("life-expectancy", 50);
  const rows = top.map(({ iso3, rank }) => {
    const country = getCountryByIso3(iso3);
    const value = getStatValue(iso3, "life-expectancy");
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
          {"@type": "ListItem", "position": 3, "name": "Highest Life Expectancy", "item": "https://countrivo.com/lists/highest-life-expectancy"}
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Which country has the highest life expectancy?",
            "acceptedAnswer": {"@type": "Answer", "text": "Monaco has the highest life expectancy in the world at over 86 years, followed closely by Japan and Liechtenstein. Exceptional healthcare, wealth, and lifestyle factors drive these numbers."}
          },
          {
            "@type": "Question",
            "name": "What are the top 5 countries by life expectancy?",
            "acceptedAnswer": {"@type": "Answer", "text": "The top 5 countries by life expectancy are: 1. Monaco (~86 years), 2. Japan (~84 years), 3. Liechtenstein (~84 years), 4. Switzerland (~84 years), 5. Singapore (~84 years)."}
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
        Countries with Highest Life Expectancy
      </h1>

      <div className="mt-6 max-w-3xl space-y-4 text-cream-muted leading-relaxed">
        <p>
          Japan and Monaco consistently top the global life expectancy charts,
          with average lifespans exceeding 84 years. Healthcare quality, diet,
          socioeconomic stability, and lifestyle all play major roles in
          determining how long people live across different nations.
        </p>
        <p>
          The global average life expectancy is approximately 73 years, but the
          gap between the highest and lowest countries is staggering — more than
          30 years separates the top from the bottom of this list.
        </p>
        <p>
          This ranking uses life expectancy at birth data from the World Bank
          and the World Health Organization.
        </p>
      </div>

      {/* Fun facts */}
      <div className="mt-10 bg-surface-elevated border border-black/5 rounded-xl p-6">
        <h2 className="text-lg font-bold mb-3">Quick Facts</h2>
        <ul className="space-y-2 text-sm text-cream-muted">
          <li>Japan consistently ranks in the top 5 for life expectancy worldwide.</li>
          <li>The global average life expectancy is approximately 73 years.</li>
          <li>The gap between the highest and lowest life expectancy is 30+ years.</li>
          <li>Diet, healthcare access, and GDP per capita are strong predictors of longevity.</li>
        </ul>
      </div>

      {/* Table */}
      <div className="mt-10 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-sm text-cream-muted">
              <th className="py-3 pr-4 font-semibold w-16">Rank</th>
              <th className="py-3 pr-4 font-semibold">Country</th>
              <th className="py-3 font-semibold text-right">Life Expectancy (years)</th>
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
                    {value !== null ? value?.toFixed(1) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Game CTAs */}
      <div className="mt-12 bg-surface-elevated border border-black/5 rounded-xl p-6">
        <h2 className="text-lg font-bold mb-2">Test Your Knowledge</h2>
        <p className="text-sm text-cream-muted mb-4">
          Can you guess which countries have the longest lifespans? Try these geography games.
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
            className="px-4 py-2 bg-white border border-black/5 shadow-sm rounded-lg text-sm font-medium hover:border-black/10 transition-colors"
          >
            Most Populated Countries
          </Link>
          <Link
            href="/lists/highest-fertility-rate"
            className="px-4 py-2 bg-white border border-black/5 shadow-sm rounded-lg text-sm font-medium hover:border-black/10 transition-colors"
          >
            Highest Fertility Rate
          </Link>
          <Link
            href="/lists/richest-countries"
            className="px-4 py-2 bg-white border border-black/5 shadow-sm rounded-lg text-sm font-medium hover:border-black/10 transition-colors"
          >
            Richest Countries
          </Link>
          <Link
            href="/lists/greenest-countries"
            className="px-4 py-2 bg-white border border-black/5 shadow-sm rounded-lg text-sm font-medium hover:border-black/10 transition-colors"
          >
            Greenest Countries
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
