import { worldAtlas } from '@/lib/data/loader';
import { getCountryByIso3 } from '@/lib/data/countries';
export function WorldMap({continent}: {continent?: string}) {
  return <svg className="world-map" viewBox={worldAtlas.viewBox} aria-label="World map, choose a country" role="group">
    {Object.entries(worldAtlas.shapes).map(([iso3,path])=>{const country=getCountryByIso3(iso3); if(!country || (continent && country.continent !== continent)) return <path key={iso3} d={path} />;return <a key={iso3} href={`/countries/${country.slug}`} aria-label={country.displayName}><title>{country.displayName}</title><path d={path} /></a>;})}
    {Object.entries(worldAtlas.points).map(([iso3,point])=>{const country=getCountryByIso3(iso3);if(!country || (continent && country.continent!==continent))return null;return <a key={iso3} href={`/countries/${country.slug}`} aria-label={country.displayName}><title>{country.displayName}</title><circle cx={point[0]} cy={point[1]} r={2} /></a>;})}
  </svg>;
}
