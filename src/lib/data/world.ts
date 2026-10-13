import { sovereignIso3 } from './loader';
import { getAllCategories } from './categories';
import { getAllCountries } from './countries';
import { getStatValue } from './ranks';
import type { Category } from '@/types/category';

export interface WorldStanding {category: Category; rank:number; count:number; value:number;}
export function worldStandings(iso3:string): WorldStanding[] {
  const sovereign = new Set(sovereignIso3);
  return getAllCategories().flatMap((category)=>{
    const value=getStatValue(iso3,category.slug);
    if(value===null || !Number.isFinite(value)) return [];
    const entries=getAllCountries().filter((country)=>sovereign.has(country.iso3)).flatMap((country)=>{const stat=getStatValue(country.iso3,category.slug);return stat!==null && Number.isFinite(stat) ? [stat] : [];});
    return [{category,rank:1+entries.filter((stat)=>stat>value).length,count:entries.length,value}];
  });
}
