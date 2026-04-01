import type { Metadata } from "next";
import Link from "next/link";
import { getAllCategories } from "@/lib/data/categories";
import { getTopCountries } from "@/lib/data/ranks";
import { getCountryByIso3 } from "@/lib/data/countries";

export const metadata: Metadata = {
  title: "All Categories",
  description:
    "Browse world statistics categories — population, GDP, area, life expectancy, and more. View global leaderboards for each stat.",
};

export default function CategoriesPage() {
  const categories = getAllCategories();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Rankings
          </h1>
          <p className="text-sm text-cream-muted mt-1">
            {categories.length} world statistics. Compare countries across every
            category.
          </p>
        </div>
        <Link
          href="/games/higher-or-lower"
          className="cta-tertiary text-sm shrink-0"
        >
          Play Higher or Lower →
        </Link>
      </div>

      {/* Challenge hook */}
      <div className="p-4 rounded-xl bg-gold-dim border border-gold/10 mb-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">Can you guess which country ranks #1?</p>
          <p className="text-xs text-cream-muted mt-0.5">Pick any category below, then play Higher or Lower to test yourself.</p>
        </div>
        <Link href="/games/higher-or-lower/play?mode=practice" className="cta-primary text-xs px-4 py-2 min-h-9 shrink-0">
          Play now
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((cat) => {
          const top3 = getTopCountries(cat.slug, 3);
          const top3Countries = top3
            .map((t) => {
              const c = getCountryByIso3(t.iso3);
              return c ? { flag: c.flagEmoji, name: c.displayName } : null;
            })
            .filter(Boolean) as { flag: string; name: string }[];

          return (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              className="p-4 rounded-xl border border-black/5 hover:border-black/10 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{cat.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-sm group-hover:text-gold transition-colors">
                      {cat.label}
                    </h2>
                    <span className="text-[10px] text-cream-muted">
                      {cat.source} {cat.sourceYear}
                    </span>
                  </div>
                  <p className="text-xs text-cream-muted mt-0.5 line-clamp-1">
                    {cat.description}
                  </p>

                  {/* Top 3 preview */}
                  {top3Countries.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-cream-muted">
                      <span className="font-medium text-cream">Top 3:</span>
                      {top3Countries.map((c, i) => (
                        <span key={i} className="flex items-center gap-0.5">
                          {c.flag}{" "}
                          <span className="hidden sm:inline">{c.name}</span>
                          {i < top3Countries.length - 1 && (
                            <span className="text-cream-ghost mx-0.5">·</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  <span className="inline-block mt-2 text-xs text-gold font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore ranking →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
