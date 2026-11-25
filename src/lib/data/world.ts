import { sovereignIso3 } from './loader';
import { getAllCategories } from './categories';
import { getAllCountries } from './countries';
import { getStatValue } from './ranks';
import type { Category } from '@/types/category';

/**
 * A place's world position on one statistic, always counted among the sovereign states
 * with data (the 195-state set the lists and ranking pages use too). This is the single
 * rank source for a country page: the meta description, the spotlight, the rankings and
 * the answer capsules all read it, so no two of them can disagree.
 *
 * `ranks.json` ranks all 243 places, territories included, which is why a territory such
 * as Martinique used to read 171st (here) in one sentence and 185th (there) in the next.
 * A territory is not one of the ranked states: its `rank` is where it would place if it
 * were ranked with them (one more than the number of states above it), and
 * `sovereign: false` tells the copy to say so.
 */
export interface WorldStanding {category: Category; rank:number; count:number; value:number; sovereign:boolean;}

export function isSovereign(iso3: string): boolean {
  return sovereignIso3.includes(iso3);
}

/** Places outside the 195-state set whose status is disputed; copy never calls them territories. */
const DISPUTED = new Set(['UNK', 'TWN', 'ESH']);

/**
 * How a non-sovereign page describes itself, after the name: `is a territory, not a
 * sovereign state`. Kosovo, Taiwan and Western Sahara get a neutral wording instead.
 */
export function notSovereignPhrase(iso3: string): string {
  return DISPUTED.has(iso3) ? `is not one of the ${sovereignIso3.length} sovereign states ranked here` : 'is a territory, not a sovereign state';
}

export function worldStandings(iso3:string): WorldStanding[] {
  const sovereign = new Set(sovereignIso3);
  const own = sovereign.has(iso3);
  return getAllCategories().flatMap((category)=>{
    const value=getStatValue(iso3,category.slug);
    if(value===null || !Number.isFinite(value)) return [];
    const entries=getAllCountries().filter((country)=>sovereign.has(country.iso3)).flatMap((country)=>{const stat=getStatValue(country.iso3,category.slug);return stat!==null && Number.isFinite(stat) ? [stat] : [];});
    return [{category,rank:1+entries.filter((stat)=>stat>value).length,count:entries.length,value,sovereign:own}];
  });
}

/** One category's standing, or undefined when the place has no value for it. */
export function worldStanding(iso3: string, categorySlug: string): WorldStanding | undefined {
  return worldStandings(iso3).find((row) => row.category.slug === categorySlug);
}
