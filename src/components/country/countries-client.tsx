"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Country } from "@/types/country";

interface CountriesClientProps {
  countries: Country[];
  continents: string[];
}

export function CountriesClient({
  countries,
  continents,
}: CountriesClientProps) {
  const [search, setSearch] = useState("");
  const [activeContinent, setActiveContinent] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = countries;
    if (activeContinent) {
      list = list.filter((c) => c.continent === activeContinent);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.displayName.toLowerCase().includes(q) ||
          c.capital?.toLowerCase().includes(q) ||
          c.region.toLowerCase().includes(q)
      );
    }
    return list;
  }, [countries, search, activeContinent]);

  const grouped = useMemo(() => {
    const map = new Map<string, Country[]>();
    for (const c of filtered) {
      const key = c.continent;
      const arr = map.get(key) ?? [];
      arr.push(c);
      map.set(key, arr);
    }
    return map;
  }, [filtered]);

  const visibleContinents = [...grouped.keys()].sort();

  return (
    <>
      {/* Search + filter */}
      <div className="sticky top-14 z-40 bg-bg/95 backdrop-blur-sm pb-3 pt-1 -mx-4 px-4">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search countries..."
            autoComplete="off"
            className="flex-1 bg-white border border-black/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/10 transition-all"
          />
          {(search || activeContinent) && (
            <button
              onClick={() => {
                setSearch("");
                setActiveContinent(null);
              }}
              className="text-xs text-cream-muted hover:text-cream transition-colors px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveContinent(null)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              !activeContinent
                ? "bg-gold text-white"
                : "bg-black/5 text-cream-muted hover:bg-black/10"
            }`}
          >
            All
          </button>
          {continents.map((c) => (
            <button
              key={c}
              onClick={() =>
                setActiveContinent(activeContinent === c ? null : c)
              }
              className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                activeContinent === c
                  ? "bg-gold text-white"
                  : "bg-black/5 text-cream-muted hover:bg-black/10"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-cream-muted mb-4">
        {filtered.length} {filtered.length === 1 ? "country" : "countries"}
        {activeContinent ? ` in ${activeContinent}` : ""}
        {search ? ` matching "${search}"` : ""}
      </p>

      {/* Country list grouped by continent */}
      {visibleContinents.map((continent) => {
        const list = grouped.get(continent)!;
        return (
          <section key={continent} className="mb-8">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              {continent}
              <span className="text-xs text-cream-muted font-normal">
                {list.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {list.map((country) => (
                <Link
                  key={country.iso3}
                  href={`/countries/${country.slug}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-border-hover hover:bg-surface transition-all group"
                >
                  <span className="text-2xl shrink-0">
                    {country.flagEmoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm group-hover:text-gold transition-colors truncate">
                      {country.displayName}
                    </p>
                    <p className="text-xs text-cream-muted truncate">
                      {country.capital
                        ? `${country.capital} · ${country.region}`
                        : country.region}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-cream-muted">No countries found.</p>
          <button
            onClick={() => {
              setSearch("");
              setActiveContinent(null);
            }}
            className="cta-tertiary text-sm mt-2"
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}
