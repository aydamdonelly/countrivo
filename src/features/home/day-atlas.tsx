import { worldAtlas } from '@/lib/data/loader';
import { getCountryByIso3 } from '@/lib/data/countries';
import type { ServerGameRun } from '@/types/server';
function countriesIn(value:unknown):string[] {
  if(typeof value === 'string') return /^[A-Z]{3}$/.test(value) && getCountryByIso3(value) ? [value] : [];
  if(Array.isArray(value))return value.flatMap(countriesIn);
  if(!value||typeof value!=='object')return [];
  return Object.values(value).flatMap(countriesIn);
}
export function discoveredCountries(runs: readonly ServerGameRun[]): Set<string> {
  return new Set(runs.flatMap(run => countriesIn(run.resultJson)));
}
export function DayAtlas({runs}:{runs:ServerGameRun[]}) {
  const met=discoveredCountries(runs);
  const regions=new Set([...met].map(getCountryByIso3).filter((country)=>Boolean(country)).map((country)=>country?.continent));
  return <div className="day-atlas"><svg className="world-map" viewBox={worldAtlas.viewBox} aria-label="Countries you met today"><use href="/design/day-map.svg#land" />{Object.entries(worldAtlas.shapes).filter(([iso3])=>met.has(iso3)).map(([iso3,path])=>{const country=getCountryByIso3(iso3);return country?<a key={iso3} href={`/countries/${country.slug}`} aria-label={country.displayName}><path className="met-country" d={path} /></a>:null;})}{Object.entries(worldAtlas.points).map(([iso3,point])=>{const country=getCountryByIso3(iso3);return met.has(iso3)&&country?<a key={iso3} href={`/countries/${country.slug}`} aria-label={country.displayName}><circle className="met-country" cx={point[0]} cy={point[1]} r={2} /></a>:null;})}</svg>{met.size?<p className="t-meta">{met.size} countries · {regions.size} regions. Pick one to explore.</p>:<p className="t-meta">Your world grows with every game.</p>}</div>;
}
