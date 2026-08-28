import type { Metadata } from "next";
import Link from "next/link";
import { getAllCategories } from "@/lib/data/categories";
import { getTopCountries } from "@/lib/data/ranks";
import { getCountryByIso3 } from "@/lib/data/countries";
import { CountryFlag } from "@/components/ui/country-flag";

export const metadata: Metadata = {
  title: "World Rankings by Statistic | Population, GDP, Area & More",
  alternates: { canonical: "https://countrivo.com/categories" },
  description:
    "Every country ranked on 21 statistics: population, GDP, area, life expectancy, tourism, forest cover and more. Sources: World Bank, WHO, UNWTO. Then test yourself in Higher or Lower.",
};

export default function CategoriesPage() {
  const categories = getAllCategories();

  return (
    <div className="max-w-md sm:max-w-lg lg:max-w-2xl mx-auto px-5 sm:px-6 pt-3 pb-12">
      <h1 className="font-display font-semibold text-[30px] leading-tight mt-2">Rankings</h1>
      <p className="mt-2 text-[14px] text-cream-muted">{categories.length} world statistics, every country ranked. Learn them here, then <Link href="/games/higher-or-lower" className="text-cream underline underline-offset-4">play Higher or Lower</Link>.</p>

      <div className="mt-6">
        {categories.map((cat) => {
          const top3 = getTopCountries(cat.slug, 3)
            .map((t) => getCountryByIso3(t.iso3))
            .filter((c): c is NonNullable<typeof c> => !!c);
          return (
            <Link key={cat.slug} href={`/categories/${cat.slug}`} className="flex items-center gap-3 py-3.5 border-t border-border -mx-2 px-2 rounded-md hover:bg-surface-elevated transition-colors">
              <span className="flex-1 min-w-0">
                <span className="block text-base leading-tight">{cat.label}</span>
                <small className="block text-xs text-cream-muted truncate">{cat.description} · {cat.source} {cat.sourceYear}</small>
              </span>
              <span className="flex items-center gap-1 shrink-0" aria-label={`Top three: ${top3.map((c) => c.displayName).join(", ")}`}>
                {top3.map((c) => <CountryFlag key={c.iso3} iso2={c.iso2} width={22} />)}
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cream-dim shrink-0" aria-hidden><path d="M9 6l6 6-6 6" /></svg>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
