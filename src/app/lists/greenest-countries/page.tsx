import type { Metadata } from "next";
import Link from "next/link";
import { getTopCountries, getStatValue } from "@/lib/data/ranks";
import { getCountryByIso3 } from "@/lib/data/countries";

export const metadata: Metadata = {
  title: "Greenest Countries | Renewable Energy by Country",
  description:
    "Countries ranked by share of energy from renewable sources. Iceland, Norway, and Brazil lead the green energy transition.",
  alternates: { canonical: "https://countrivo.com/lists/greenest-countries" },
};

export default function GreenestCountriesPage() {
  const top = getTopCountries("renewable-energy-pct", 50);
  const rows = top.map(({ iso3, rank }) => {
    const country = getCountryByIso3(iso3);
    const value = getStatValue(iso3, "renewable-energy-pct");
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
          {"@type": "ListItem", "position": 3, "name": "Greenest Countries", "item": "https://countrivo.com/lists/greenest-countries"}
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Which country has the highest renewable energy usage?",
            "acceptedAnswer": {"@type": "Answer", "text": "Iceland is nearly 100% powered by renewable energy, primarily geothermal and hydropower. Norway and Paraguay also derive the vast majority of their energy from renewable sources."}
          },
          {
            "@type": "Question",
            "name": "What are the top 5 countries by renewable energy share?",
            "acceptedAnswer": {"@type": "Answer", "text": "The top 5 greenest countries by renewable energy share are: 1. Iceland (~90%+), 2. Norway (~70%+), 3. Brazil (~45%+), 4. New Zealand (~40%+), 5. Sweden (~55%+) — though exact rankings depend on the metric used."}
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
        Greenest Countries by Renewable Energy Usage
      </h1>

      <div className="mt-6 max-w-3xl space-y-4 text-cream-muted leading-relaxed">
        <p>
          Hydropower-rich nations dominate the renewable energy rankings.
          Iceland is nearly 100% powered by renewable sources — primarily
          geothermal and hydroelectric energy. Norway, Brazil, and New Zealand
          also derive large shares of their energy from renewables.
        </p>
        <p>
          Many developing nations also rank surprisingly high due to their
          reliance on biomass (wood, charcoal, agricultural waste) for energy.
          While this is technically renewable, it comes with deforestation and
          air quality concerns.
        </p>
        <p>
          This ranking uses the share of total energy consumption from
          renewable sources, based on data from the International Energy Agency
          (IEA) and World Bank.
        </p>
      </div>

      {/* Fun facts */}
      <div className="mt-10 bg-surface border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold mb-3">Quick Facts</h2>
        <ul className="space-y-2 text-sm text-cream-muted">
          <li>Iceland is nearly 100% powered by renewable energy (geothermal + hydro).</li>
          <li>Hydropower is the largest single source of renewable energy globally.</li>
          <li>Many developing nations have high renewable shares due to biomass usage.</li>
          <li>The global renewable energy share is roughly 18% and growing.</li>
        </ul>
      </div>

      {/* Table */}
      <div className="mt-10 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-sm text-cream-muted">
              <th className="py-3 pr-4 font-semibold w-16">Rank</th>
              <th className="py-3 pr-4 font-semibold">Country</th>
              <th className="py-3 font-semibold text-right">Renewable Energy (%)</th>
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
          Can you guess which countries are the greenest? Try these geography games.
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
            href="/lists/most-forested-countries"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Most Forested Countries
          </Link>
          <Link
            href="/lists/most-connected-countries"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Most Connected Countries
          </Link>
          <Link
            href="/lists/highest-life-expectancy"
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:border-border transition-colors"
          >
            Highest Life Expectancy
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
