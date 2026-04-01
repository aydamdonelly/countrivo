import type { Metadata } from "next";
import Link from "next/link";
import { getTopCountries, getStatValue } from "@/lib/data/ranks";
import { getCountryByIso3 } from "@/lib/data/countries";

export const metadata: Metadata = {
  title: "Most Forested Countries | Forest Coverage Ranking",
  description:
    "Countries with the highest percentage of forest coverage. Suriname, Gabon, and Micronesia lead with 90%+ forest cover.",
  alternates: { canonical: "https://countrivo.com/lists/most-forested-countries" },
};

export default function MostForestedCountriesPage() {
  const top = getTopCountries("forest-coverage-pct", 50);
  const rows = top.map(({ iso3, rank }) => {
    const country = getCountryByIso3(iso3);
    const value = getStatValue(iso3, "forest-coverage-pct");
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
          {"@type": "ListItem", "position": 3, "name": "Most Forested Countries", "item": "https://countrivo.com/lists/most-forested-countries"}
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Which country has the highest forest coverage?",
            "acceptedAnswer": {"@type": "Answer", "text": "Suriname has the highest percentage of forest coverage in the world, with over 90% of its land area covered by tropical rainforest. Gabon and Micronesia also exceed 90% forest cover."}
          },
          {
            "@type": "Question",
            "name": "What are the top 5 most forested countries by percentage?",
            "acceptedAnswer": {"@type": "Answer", "text": "The top 5 most forested countries by percentage of land covered are: 1. Suriname (~98%), 2. Micronesia (~92%), 3. Gabon (~90%), 4. Seychelles (~88%), 5. Palau (~88%)."}
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
        Most Forested Countries in the World
      </h1>

      <div className="mt-6 max-w-3xl space-y-4 text-cream-muted leading-relaxed">
        <p>
          Small tropical nations often have the highest percentage of forest
          coverage. Suriname, Gabon, and Micronesia each have over 90% of their
          land area covered by forest, making them some of the greenest places
          on Earth.
        </p>
        <p>
          Brazil has the largest total forest area in the world but does not
          rank at the top by percentage. The Amazon rainforest covers about 60%
          of Brazil&apos;s territory, yet large swathes of the country are
          savanna, wetland, and agricultural land.
        </p>
        <p>
          Forest coverage is critical for biodiversity, carbon sequestration,
          and climate regulation. This ranking is based on the percentage of
          total land area covered by forest, sourced from the World Bank and the
          FAO Global Forest Resources Assessment.
        </p>
      </div>

      {/* Fun facts */}
      <div className="mt-10 bg-surface border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold mb-3">Quick Facts</h2>
        <ul className="space-y-2 text-sm text-cream-muted">
          <li>Suriname has over 90% forest coverage — the highest in the world.</li>
          <li>Brazil has the largest total forest area but not the highest percentage.</li>
          <li>Deforestation rates have slowed in many regions but remain a concern.</li>
          <li>Forests cover roughly 31% of the world&apos;s total land area.</li>
        </ul>
      </div>

      {/* Table */}
      <div className="mt-10 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-sm text-cream-muted">
              <th className="py-3 pr-4 font-semibold w-16">Rank</th>
              <th className="py-3 pr-4 font-semibold">Country</th>
              <th className="py-3 font-semibold text-right">Forest Cover (%)</th>
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
          Can you guess which countries have the most forest? Try these geography games.
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
            href="/lists/greenest-countries"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Greenest Countries
          </Link>
          <Link
            href="/lists/largest-countries"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Largest Countries by Area
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
        </div>
      </div>
    </div>
    </>
  );
}
