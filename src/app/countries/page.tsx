import type { Metadata } from "next";
import Link from "next/link";
import { getAllCountries } from "@/lib/data/countries";

export const metadata: Metadata = {
  title: "All Countries",
  description:
    "Explore all 195 countries with flags, capitals, continents, and world statistics. Browse by region or continent.",
};

export default function CountriesPage() {
  const countries = getAllCountries();

  const grouped = new Map<string, typeof countries>();
  for (const country of countries) {
    const list = grouped.get(country.continent) ?? [];
    list.push(country);
    grouped.set(country.continent, list);
  }

  const continents = [...grouped.keys()].sort();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
        All Countries
      </h1>
      <p className="text-cream-muted mb-10">
        {countries.length} countries and territories grouped by continent.
      </p>

      {continents.map((continent) => {
        const list = grouped.get(continent)!;
        return (
          <section key={continent} className="mb-10">
            <h2 className="text-xl font-bold mb-4">{continent}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.map((country) => (
                <Link
                  key={country.iso3}
                  href={`/countries/${country.slug}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-border hover:bg-surface transition-all group"
                >
                  <span className="text-3xl shrink-0">
                    {country.flagEmoji}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold group-hover:text-gold transition-colors truncate">
                      {country.displayName}
                    </p>
                    <p className="text-xs text-cream-muted truncate">
                      {country.region}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
