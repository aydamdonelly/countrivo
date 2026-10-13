import { getAllCountries } from '@/lib/data/countries';
import { sovereignIso3 } from '@/lib/data/loader';
import { getStatValue } from '@/lib/data/ranks';
import { formatStat } from '@/lib/utils';
import { Clay } from '@/ui/clay';
import { Flag, GameRow, SectionHead, SiteFoot } from '@/ui';
import { CountriesSearch } from './countries-search';
import { WorldMap } from './world-map';
import './seo.css';
const CONTINENTS=['Africa','Americas','Asia','Europe','Oceania'];
export function CountriesHub(){
  const countries=[...getAllCountries()].sort((a,b)=>a.displayName.localeCompare(b.displayName));
  const other=countries.filter((country)=>!sovereignIso3.includes(country.iso3));
  const groups=[...CONTINENTS.map((continent)=>({title:continent,id:continent.toLowerCase(),countries:countries.filter((country)=>country.continent===continent&&sovereignIso3.includes(country.iso3))})),{title:'Territories and other places',id:'other-places',countries:other}];
  return <>
    <div className="world-index-hero"><div><h1 className="t-h1">Countries of the world</h1><p className="t-body text-mute">{sovereignIso3.length} countries, and {other.length} territories and other places.</p></div><Clay object="cl-24" state="americas" alternate="afreu" /></div>
    <CountriesSearch total={countries.length} />
    <WorldMap />
    <nav className="table-subnav mb-6" aria-label="Jump to a region">{groups.map((group)=><a key={group.id} href={`#${group.id}`}>{group.title}</a>)}</nav>
    <div id="country-index" className="cx">{groups.map((group)=><section className="ls" id={group.id} key={group.id}><SectionHead title={group.title} fact={`${group.countries.length} places`} /><div className="cols2">{group.countries.map((country)=>{const population=getStatValue(country.iso3,'population');return <GameRow key={country.slug} href={`/countries/${country.slug}`} title={country.displayName} meta={population!==null?`${formatStat(population,'people')}${country.capital?` · ${country.capital}`:''}`:country.capital||country.subregion} lead={<Flag iso2={country.iso2} size="xs" alt="" />} />;})}</div></section>)}</div>
    <SiteFoot />
  </>;
}
