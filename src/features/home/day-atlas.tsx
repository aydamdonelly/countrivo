import { worldAtlas } from '@/lib/data/loader';
import { getCountryByIso3 } from '@/lib/data/countries';
import type { ServerGameRun } from '@/types/server';
function countriesIn(value:unknown):string[] {
  if(Array.isArray(value))return value.flatMap(countriesIn);
  if(!value||typeof value!=='object')return [];
  return Object.entries(value).flatMap(([key,entry])=>['iso3','countryIso3','answerIso3'].includes(key)&&typeof entry==='string'?[entry]:countriesIn(entry));
}
export function DayAtlas({runs}:{runs:ServerGameRun[]}) {
  const met=new Set(runs.flatMap((run)=>countriesIn(run.resultJson)));
  const regions=new Set([...met].map(getCountryByIso3).filter((country)=>Boolean(country)).map((country)=>country?.continent));
  return <div className="day-atlas"><svg className="world-map" viewBox={worldAtlas.viewBox} aria-label="Countries you met today">{Object.entries(worldAtlas.shapes).map(([iso3,path])=>{const country=getCountryByIso3(iso3);return met.has(iso3)&&country?<a key={iso3} href={`/countries/${country.slug}`} aria-label={country.displayName}><path className="met-country" d={path} /></a>:<path key={iso3} d={path} />;})}{Object.entries(worldAtlas.points).map(([iso3,point])=>{const country=getCountryByIso3(iso3);return met.has(iso3)&&country?<a key={iso3} href={`/countries/${country.slug}`} aria-label={country.displayName}><circle className="met-country" cx={point[0]} cy={point[1]} r={2} /></a>:null;})}</svg>{met.size?<p className="t-body">You met {met.size} countries across {regions.size} regions today. Pick one on the map and keep exploring.</p>:<p className="t-body">Six different ways to look at the world.</p>}</div>;
}
