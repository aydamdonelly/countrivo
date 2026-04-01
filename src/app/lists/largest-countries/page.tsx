import type { Metadata } from "next";
import Link from "next/link";
import { getGameColor } from "@/lib/game-colors";
import { getTopCountries, getStatValue } from "@/lib/data/ranks";
import { getCountryByIso3 } from "@/lib/data/countries";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Largest Countries in the World by Area (2024)",
  description:
    "Ranked list of the 50 largest countries in the world by total area in km². From Russia to Bangladesh, see how big each nation really is.",
  alternates: { canonical: "https://countrivo.com/lists/largest-countries" },
};

export default function LargestCountriesPage() {
  const top = getTopCountries("area-km2", 50);
  const rows = top.map(({ iso3, rank }) => {
    const country = getCountryByIso3(iso3);
    const area = getStatValue(iso3, "area-km2");
    return { country, rank, area };
  });

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://countrivo.com"},
          {"@type": "ListItem", "position": 2, "name": "Lists", "item": "https://countrivo.com/lists"},
          {"@type": "ListItem", "position": 3, "name": "Largest Countries", "item": "https://countrivo.com/lists/largest-countries"}
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Which is the largest country in the world?",
            "acceptedAnswer": {"@type": "Answer", "text": "Russia is the largest country in the world by area, covering approximately 17.1 million km² — over 11% of Earth's total land surface."}
          },
          {
            "@type": "Question",
            "name": "What are the top 5 largest countries by area?",
            "acceptedAnswer": {"@type": "Answer", "text": "The 5 largest countries are: 1. Russia (17.1M km²), 2. Canada (10.0M km²), 3. United States (9.8M km²), 4. China (9.6M km²), 5. Brazil (8.5M km²)."}
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
        Largest Countries in the World by Area
      </h1>

      <div className="mt-6 max-w-3xl space-y-4 text-cream-muted leading-relaxed">
        <p>
          The world&apos;s largest countries span entire continents. Russia alone
          covers over 17 million square kilometers — roughly 1.8 times the size of
          the second-largest country, Canada. Together, the top ten countries by
          area account for more than half of all the land on Earth.
        </p>
        <p>
          This ranking uses total area, which includes both land and inland water
          bodies such as lakes and rivers. Data is sourced from the World Bank and
          national geographic agencies.
        </p>
        <p>
          A country&apos;s size has profound effects on its climate diversity,
          natural resources, and logistical challenges. Brazil, for example,
          contains the world&apos;s largest tropical rainforest, while Australia&apos;s
          vast interior is predominantly arid desert.
        </p>
      </div>

      {/* Fun facts */}
      <div className="mt-10 bg-surface-elevated border border-black/5 rounded-xl p-6">
        <h2 className="text-lg font-bold mb-3">Quick Facts</h2>
        <ul className="space-y-2 text-sm text-cream-muted">
          <li>Russia is about 1.8x larger than Canada, the second-largest country.</li>
          <li>The top 3 countries (Russia, Canada, USA/China) each exceed 9 million km².</li>
          <li>Vatican City, the smallest country, could fit inside Russia over 38 billion times.</li>
          <li>Africa contains 6 of the 30 largest countries by area.</li>
        </ul>
      </div>

      {/* Table */}
      <div className="mt-10 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-sm text-cream-muted">
              <th className="py-3 pr-4 font-semibold w-16">Rank</th>
              <th className="py-3 pr-4 font-semibold">Country</th>
              <th className="py-3 font-semibold text-right">Area (km²)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ country, rank, area }) => {
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
                    {area !== null ? formatNumber(area) : "—"}
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
          Can you rank countries by size from memory? Try these geography games.
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { href: "/games/higher-or-lower", name: "Higher or Lower" },
            { href: "/games/country-draft", name: "Country Draft" },
            { href: "/games/flag-quiz", name: "Flag Quiz" },
          ].map((g) => {
            const slug = g.href.replace("/games/", "");
            const colors = getGameColor(slug);
            return (
              <Link
                key={g.href}
                href={g.href}
                className="px-4 py-2 font-semibold rounded-full text-sm transition-all hover:scale-105"
                style={{ backgroundColor: colors.bg, color: colors.text }}
              >
                {g.name}
              </Link>
            );
          })}
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
            href="/lists/richest-countries"
            className="px-4 py-2 bg-white border border-black/5 shadow-sm rounded-lg text-sm font-medium hover:border-black/10 transition-colors"
          >
            Richest Countries
          </Link>
          <Link
            href="/lists/countries-in-asia"
            className="px-4 py-2 bg-white border border-black/5 shadow-sm rounded-lg text-sm font-medium hover:border-black/10 transition-colors"
          >
            Countries in Asia
          </Link>
          <Link
            href="/lists/countries-in-africa"
            className="px-4 py-2 bg-white border border-black/5 shadow-sm rounded-lg text-sm font-medium hover:border-black/10 transition-colors"
          >
            Countries in Africa
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
