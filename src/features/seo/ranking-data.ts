import { sovereignIso3 } from '@/lib/data/loader';
import { getCountryByIso3 } from '@/lib/data/countries';
import { getStatValue, getTopCountries } from '@/lib/data/ranks';

/** Shared by the visible table, search snippet and structured data. */
export function sovereignRanking(categorySlug: string) {
  const sovereign = new Set(sovereignIso3);
  return getTopCountries(categorySlug, 300)
    .filter(({ iso3 }) => {
      const value = getStatValue(iso3, categorySlug);
      return sovereign.has(iso3) && getCountryByIso3(iso3) && value !== null && Number.isFinite(value);
    })
    .map(({ iso3 }, index) => ({ iso3, rank: index + 1 }));
}
