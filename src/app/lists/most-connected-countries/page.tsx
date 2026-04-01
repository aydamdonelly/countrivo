import type { Metadata } from "next";
import Link from "next/link";
import { getTopCountries, getStatValue } from "@/lib/data/ranks";
import { getCountryByIso3 } from "@/lib/data/countries";

export const metadata: Metadata = {
  title: "Most Connected Countries | Internet Usage by Country",
  description:
    "Countries ranked by percentage of population using the internet. See which nations are most digitally connected.",
  alternates: { canonical: "https://countrivo.com/lists/most-connected-countries" },
};

export default function MostConnectedCountriesPage() {
  const top = getTopCountries("internet-users-pct", 50);
  const rows = top.map(({ iso3, rank }) => {
    const country = getCountryByIso3(iso3);
    const value = getStatValue(iso3, "internet-users-pct");
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
          {"@type": "ListItem", "position": 3, "name": "Most Connected Countries", "item": "https://countrivo.com/lists/most-connected-countries"}
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Which country has the highest internet usage?",
            "acceptedAnswer": {"@type": "Answer", "text": "Several small, wealthy nations approach 100% internet penetration. Northern European countries like Denmark, Iceland, and Luxembourg consistently rank among the most connected in the world."}
          },
          {
            "@type": "Question",
            "name": "What are the top 5 countries by internet usage?",
            "acceptedAnswer": {"@type": "Answer", "text": "The top 5 most connected countries by percentage of population online are: 1. Denmark (~99%), 2. Iceland (~99%), 3. Luxembourg (~99%), 4. Liechtenstein (~99%), 5. Bahrain (~99%)."}
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
        Most Connected Countries by Internet Usage
      </h1>

      <div className="mt-6 max-w-3xl space-y-4 text-cream-muted leading-relaxed">
        <p>
          Northern European and Gulf states lead the world in internet
          penetration, with several nations approaching 100% of the population
          online. Digital connectivity is closely correlated with economic
          development, education, and government investment in infrastructure.
        </p>
        <p>
          The digital divide between the most and least connected countries
          remains dramatic. While top-ranked nations have near-universal access,
          some countries in Sub-Saharan Africa and South Asia have internet
          penetration rates below 20%.
        </p>
        <p>
          This ranking uses the percentage of population using the internet,
          sourced from the International Telecommunication Union (ITU) and
          World Bank data.
        </p>
      </div>

      {/* Fun facts */}
      <div className="mt-10 bg-surface border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold mb-3">Quick Facts</h2>
        <ul className="space-y-2 text-sm text-cream-muted">
          <li>Multiple countries now have 99%+ internet penetration.</li>
          <li>Northern Europe and the Gulf states dominate the top rankings.</li>
          <li>The global average internet penetration is roughly 60%.</li>
          <li>Mobile internet has been the primary driver of growth in developing nations.</li>
        </ul>
      </div>

      {/* Table */}
      <div className="mt-10 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-sm text-cream-muted">
              <th className="py-3 pr-4 font-semibold w-16">Rank</th>
              <th className="py-3 pr-4 font-semibold">Country</th>
              <th className="py-3 font-semibold text-right">Internet Users (%)</th>
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
                    {value !== null ? value?.toFixed(1) + "%" : "—"}
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
          Can you guess which countries are the most connected? Try these geography games.
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
            href="/lists/highest-gdp-countries"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Largest Economies by GDP
          </Link>
          <Link
            href="/lists/richest-countries"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Richest Countries
          </Link>
          <Link
            href="/lists/highest-life-expectancy"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Highest Life Expectancy
          </Link>
          <Link
            href="/lists/greenest-countries"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Greenest Countries
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
