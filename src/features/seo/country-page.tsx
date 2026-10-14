import Link from 'next/link';
import { getAllCountries, getCountryByIso3 } from '@/lib/data/countries';
import { countryBorders, sovereignIso3, draftPortraitCredit } from '@/lib/data/loader';
import { worldStandings, type WorldStanding } from '@/lib/data/world';
import { getStatValue, getRanksForCountry } from '@/lib/data/ranks';
import { formatStat } from '@/lib/utils';
import { POOL } from '@/lib/game-logic/country-draft/roster';
import { LOOKALIKES } from '@/lib/game-logic/flag-quiz/pools';
import type { Country } from '@/types/country';
import { Flag } from "@/ui/flag";
import { StatIcon } from "@/ui/icons/stat";
import { SiteFoot } from "@/ui/site-foot";
import { GameRow } from "@/ui/game-row";
import { Portrait } from "@/ui/portrait";
import { Clay } from '@/ui/clay';
import { buildCapsules } from './capsules';
import { CapsuleList } from './capsules-list';
import './seo.css';

export function CountryPage({country}: {country: Country}) {
  const name=country.displayName;
  const neighbours=(countryBorders[country.iso3] ?? []).map(getCountryByIso3).filter((c): c is Country=>Boolean(c));
  const standings=worldStandings(country.iso3);
  const verified=standings.filter(row=>!['coffee-consumption-per-capita','beer-consumption-per-capita','wine-consumption-per-capita'].includes(row.category.slug));
  const nearTop=[...verified].sort((a,b)=>a.rank/a.count-b.rank/b.count).slice(0,3);
  const nearBottom=[...verified].sort((a,b)=>b.rank/b.count-a.rank/a.count).filter((row)=>!nearTop.includes(row)).slice(0,3);
  const notable=nearTop.find((row)=>row.count>=50 && !['military-spending-pct','unemployment-rate','inflation-rate','fdi-inflow'].includes(row.category.slug));
  const people=POOL.find((c)=>c.iso3===country.iso3)?.groups.flatMap((group)=>group.people).filter((person)=>person.portrait).slice(0,6) ?? [];
  const family=LOOKALIKES.find((set)=>[...set.core,...set.kin].includes(country.iso3));
  const area=getStatValue(country.iso3,'area-km2');
  const comparisons=getAllCountries().filter((c)=>c.iso3!==country.iso3 && sovereignIso3.includes(c.iso3));
  const sizePeer=area===null ? undefined : comparisons.map((c)=>({country:c,area:getStatValue(c.iso3,'area-km2')})).filter((entry):entry is {country:Country;area:number}=>entry.area!==null).sort((a,b)=>Math.abs(a.area-area)-Math.abs(b.area-area))[0];
  const income=getStatValue(country.iso3,'gdp-per-capita');
  const incomes=comparisons.map((c)=>getStatValue(c.iso3,'gdp-per-capita')).filter((value):value is number=>value!==null).sort((a,b)=>a-b);
  const median=incomes[Math.floor(incomes.length/2)];
  const state=country.continent==='Americas'?'americas':country.continent==='Asia'?'asia':country.continent==='Oceania'?'pacific':'afreu';
  const capsules=buildCapsules(country,getRanksForCountry(country.iso3),neighbours);
  return <>
    <div className="dossier">
      <div className="dossier-hero"><div className="identity"><Flag iso2={country.iso2} size="hero" alt={`Flag of ${name}`} eager /><div><h1 className="t-h1">{name}</h1><p className="t-meta text-mute">{country.subregion}, {country.continent}</p>{!sovereignIso3.includes(country.iso3)?<p className="t-meta text-mute">Territory or other place</p>:null}</div></div><Clay object="cl-24" state={state} /></div>
      {notable ? <div className="dossier-intro dossier-stat-spotlight"><span className="t-meta text-mute">{notable.category.shortLabel}</span><div><b className="t-score-l num">#{notable.rank}</b><span className="t-meta text-mute">of {notable.count} countries</span></div><p className="t-h3">{formatStat(notable.value,notable.category.unit)}</p><Link className="t-meta text-mute" href={`/sources#${notable.category.slug}`}>{notable.category.source} {notable.category.sourceYear}</Link></div> : null}
      <div className="dossier-comparisons">
        {sizePeer && area!==null ? <div><p className="t-h3">About the size of {sizePeer.country.displayName}</p><p className="t-meta text-mute">{formatStat(area,'km²')} against {formatStat(sizePeer.area,'km²')}. Total area, REST Countries.</p></div> : null}
        {income!==null && median ? <div><p className="t-h3">{Math.round(income/median*100)}% of world median</p><p className="t-meta text-mute">GDP per person</p><details className="dossier-method t-meta"><summary>Method</summary><p>Median among {incomes.length} other countries with data. GDP per person is not household income.</p></details></div> : null}
      </div>
      <div className="dossier-grid">
        <div>
          <section className="dossier-section"><h2 className="t-h2">World rankings</h2><p className="t-meta text-mute mb-4">Sovereign states with data</p><p className="t-body">Highest rankings</p><StandingRows rows={nearTop} />{nearBottom.length ? <><p className="t-body mt-6">Lowest rankings</p><StandingRows rows={nearBottom} /></> : null}</section>
          {neighbours.length ? <section className="dossier-section"><h2 className="t-h2">Neighbours</h2>{neighbours.map((neighbour)=><GameRow key={neighbour.iso3} href={`/countries/${neighbour.slug}`} title={neighbour.displayName} meta={neighbour.capital ? `Capital: ${neighbour.capital}` : neighbour.subregion} lead={<Flag iso2={neighbour.iso2} size="xs" alt="" />} />)}</section> : <section className="dossier-section"><h2 className="t-h2">Neighbours</h2><p className="t-body text-mute">No international land borders in this dataset.</p></section>}
        </div>
        <div>
          {people.length ? <section className="dossier-section"><h2 className="t-h2">People from here</h2><div className="dossier-people">{people.map((person)=>{const credit=draftPortraitCredit(person.slug);return <div key={person.slug}><Portrait slug={person.slug} name={person.name} has={person.portrait} size={56} /><a className="t-body" href={person.biography} target="_blank" rel="noreferrer">{person.name}</a><p className="t-meta text-mute">{person.note}</p>{credit ? <small>Photo: {credit.author || 'Wikimedia Commons'}, {credit.licence}</small> : null}</div>;})}</div></section>:null}
          {family ? <section className="dossier-section"><h2 className="t-h2">Its flag family</h2><div className="flag-family">{[...family.core,...family.kin].map(getCountryByIso3).filter((c):c is Country=>Boolean(c)).map((c)=><Link href={`/countries/${c.slug}`} key={c.iso3}><Flag iso2={c.iso2} size="m" alt="" /><span>{c.displayName}</span></Link>)}</div><p className="t-body">{family.line}</p><p className="t-meta text-mute">CIA World Factbook.</p></section>:null}
        </div>
      </div>
      <section className="dossier-play"><h2 className="t-h2 mb-4">Play with {name}</h2>{people.length>=6 ? <GameRow slug="country-draft" title={`Draft from ${name}`} meta="Practice" href={`/games/country-draft/play?mode=practice&country=${country.iso3}`} />:null}<GameRow slug="stat-guesser" title="Guess a stat" meta="Practice" href={`/games/stat-guesser/play?mode=practice&country=${country.iso3}`} /><GameRow slug="pinpoint" title="Put it on the map" meta="Pinpoint" href="/games/pinpoint" /></section>
      <section className="dossier-capsules"><h2 className="t-h2 mb-4">{name}, in short</h2><CapsuleList capsules={capsules} /></section>
    </div>
    <SiteFoot />
  </>;
}

function StandingRows({rows}: {rows:WorldStanding[]}) {
  return <div className="dossier-standings">{rows.map((row)=><Link key={row.category.slug} href={`/categories/${row.category.slug}`}><StatIcon slug={row.category.slug} size={20} /><span>{row.category.shortLabel}<small>{formatStat(row.value,row.category.unit)}. {row.category.source} {row.category.sourceYear}.</small></span><span className="t-meta">{row.rank} of {row.count}</span></Link>)}</div>;
}
