import type { Metadata } from "next";
import Link from "next/link";
import { getAllCountries } from "@/lib/data/countries";
import { CountriesClient } from "@/components/country/countries-client";

export const metadata: Metadata = {
  title: "All Countries",
  description:
    "Explore 243 countries with flags, capitals, continents, and world statistics. Search, filter, and compare.",
};

// Curated "did you know" facts that create curiosity
const COUNTRY_PULLS = [
  { flag: "🇲🇨", text: "Monaco is smaller than Central Park.", link: "/countries/monaco" },
  { flag: "🇱🇸", text: "Lesotho is entirely inside another country.", link: "/countries/lesotho" },
  { flag: "🇳🇷", text: "Nauru has no official capital city.", link: "/countries/nauru" },
  { flag: "🇨🇦", text: "Canada has more lakes than all other countries combined.", link: "/countries/canada" },
];

export default function CountriesPage() {
  const countries = getAllCountries();
  const continents = [...new Set(countries.map((c) => c.continent))].sort();

  // Pick 2 random facts deterministically by day
  const dayIndex = Math.floor(Date.now() / 86400000);
  const pull1 = COUNTRY_PULLS[dayIndex % COUNTRY_PULLS.length];
  const pull2 = COUNTRY_PULLS[(dayIndex + 1) % COUNTRY_PULLS.length];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Countries
          </h1>
          <p className="text-sm text-cream-muted mt-1">
            {countries.length} countries and territories. Search, filter, explore.
          </p>
        </div>
        <Link href="/games/flag-quiz" className="cta-tertiary text-sm shrink-0">
          Test your knowledge →
        </Link>
      </div>

      {/* Curiosity hooks — rotate daily */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
        {[pull1, pull2].map((pull, i) => (
          <Link
            key={i}
            href={pull.link}
            className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated border border-border hover:border-border-hover transition-all group"
          >
            <span className="text-2xl">{pull.flag}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium group-hover:text-gold transition-colors">
                {pull.text}
              </p>
              <p className="text-[10px] text-cream-muted">Did you know? →</p>
            </div>
          </Link>
        ))}
      </div>

      <CountriesClient countries={countries} continents={continents} />
    </div>
  );
}
