import countriesData from '@/data/countries.json';
import categoriesData from '@/data/categories.json';
import capitalsAcceptedData from '@/data/capitals-accepted.json';
import centroidsData from '@/data/centroids.json';
import sovereignData from '@/data/sovereign.json';
import type { Country } from '@/types/country';
import type { Category } from '@/types/category';

// Client-safe metadata has no import path back to draft records or border geometry.
export const countries: Country[] = countriesData;
// Preserve historical source files while withholding rows with unverified reuse rights.
const WITHHELD_STATS = new Set(['beer-consumption-per-capita', 'coffee-consumption-per-capita', 'wine-consumption-per-capita', 'military-spending-pct']);
export const categories: Category[] = categoriesData.filter(category => !WITHHELD_STATS.has(category.slug)).map(category => {
  const direction = category.direction;
  if (direction !== 'higher_is_better' && direction !== 'lower_is_better' && direction !== 'neutral') {
    throw new Error(`Invalid direction for ${category.slug}`);
  }
  return { ...category, direction };
});
export const capitalsAccepted: Readonly<Record<string, readonly string[]>> = capitalsAcceptedData;
export const centroids: Record<string, number[]> = centroidsData;
export const sovereignIso3: readonly string[] = sovereignData;
