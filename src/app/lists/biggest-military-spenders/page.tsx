import type { Metadata } from "next";
import Link from "next/link";
import { getTopCountries, getStatValue } from "@/lib/data/ranks";
import { getCountryByIso3 } from "@/lib/data/countries";

export const metadata: Metadata = {
  title: "Biggest Military Spenders | Defense Budget by Country",
  description:
    "Countries ranked by military spending as percentage of GDP. From conflict zones to NATO powers.",
  alternates: { canonical: "https://countrivo.com/lists/biggest-military-spenders" },
};

export default function BiggestMilitarySpendersPage() {
  const top = getTopCountries("military-spending-pct", 50);
  const rows = top.map(({ iso3, rank }) => {
    const country = getCountryByIso3(iso3);
    const value = getStatValue(iso3, "military-spending-pct");
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
          {"@type": "ListItem", "position": 3, "name": "Biggest Military Spenders", "item": "https://countrivo.com/lists/biggest-military-spenders"}
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Which country spends the highest percentage of GDP on military?",
            "acceptedAnswer": {"@type": "Answer", "text": "Countries affected by conflict, such as Ukraine and certain Middle Eastern nations, often spend the highest percentage of GDP on defense — sometimes exceeding 5-6% of GDP. In absolute dollar terms, the USA spends the most by far."}
          },
          {
            "@type": "Question",
            "name": "What are the top 5 countries by military spending as percentage of GDP?",
            "acceptedAnswer": {"@type": "Answer", "text": "The top 5 countries by military spending as a percentage of GDP typically include conflict-affected and strategically focused nations such as Ukraine, Saudi Arabia, Israel, Qatar, and Algeria, though exact rankings vary by year."}
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
        Countries with Highest Military Spending
      </h1>

      <div className="mt-6 max-w-3xl space-y-4 text-cream-muted leading-relaxed">
        <p>
          Conflict-affected states often top the list when measuring military
          spending as a percentage of GDP. Nations facing active security
          threats or regional instability dedicate a larger share of their
          economies to defense than the global average of roughly 2.2%.
        </p>
        <p>
          In absolute dollar terms, the picture is very different — the United
          States, China, and India dominate total military expenditure. The US
          alone spends more on defense than the next ten countries combined.
        </p>
        <p>
          This ranking uses military expenditure as a percentage of GDP,
          sourced from the Stockholm International Peace Research Institute
          (SIPRI) and World Bank data.
        </p>
      </div>

      {/* Fun facts */}
      <div className="mt-10 bg-surface-elevated border border-black/5 rounded-xl p-6">
        <h2 className="text-lg font-bold mb-3">Quick Facts</h2>
        <ul className="space-y-2 text-sm text-cream-muted">
          <li>The global average military spending is roughly 2.2% of GDP.</li>
          <li>NATO members aim for a minimum of 2% of GDP on defense.</li>
          <li>The US spends more on its military than the next 10 countries combined in absolute terms.</li>
          <li>Conflict-affected nations often exceed 5% of GDP on military spending.</li>
        </ul>
      </div>

      {/* Table */}
      <div className="mt-10 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-sm text-cream-muted">
              <th className="py-3 pr-4 font-semibold w-16">Rank</th>
              <th className="py-3 pr-4 font-semibold">Country</th>
              <th className="py-3 font-semibold text-right">Military (% of GDP)</th>
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
      <div className="mt-12 bg-surface-elevated border border-black/5 rounded-xl p-6">
        <h2 className="text-lg font-bold mb-2">Test Your Knowledge</h2>
        <p className="text-sm text-cream-muted mb-4">
          Can you guess which countries spend the most on defense? Try these geography games.
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
            className="px-4 py-2 bg-white border border-black/5 shadow-sm rounded-lg text-sm font-medium hover:border-black/10 transition-colors"
          >
            Largest Economies by GDP
          </Link>
          <Link
            href="/lists/most-populated-countries"
            className="px-4 py-2 bg-white border border-black/5 shadow-sm rounded-lg text-sm font-medium hover:border-black/10 transition-colors"
          >
            Most Populated Countries
          </Link>
          <Link
            href="/lists/largest-countries"
            className="px-4 py-2 bg-white border border-black/5 shadow-sm rounded-lg text-sm font-medium hover:border-black/10 transition-colors"
          >
            Largest Countries by Area
          </Link>
          <Link
            href="/lists/most-visited-countries"
            className="px-4 py-2 bg-white border border-black/5 shadow-sm rounded-lg text-sm font-medium hover:border-black/10 transition-colors"
          >
            Most Visited Countries
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
