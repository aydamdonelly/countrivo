import Link from 'next/link';
import { getCategoryBySlug } from '@/lib/data/categories';
import { getCountryByIso3 } from '@/lib/data/countries';
import { getStatValue } from '@/lib/data/ranks';
import { Clay } from '@/ui/clay';
import { Flag } from '@/ui/flag';
import { GamePlayLink } from '@/ui/game-play-link';
import { SiteFoot } from '@/ui/site-foot';
import { ChevronRightIcon } from '@/ui/icons/chevron-right';
import { breadcrumbList, graph, jsonLdProps } from './breadcrumbs';
import './urban-geography.css';

const URBAN = 'urban-population-pct';
const COMPARISONS = [['JPN', 'BRA'], ['NGA', 'IND']] as const;

function UrbanComparison({ pair, index }: { pair: readonly [string, string]; index: number }) {
  const places = pair.flatMap(iso3 => {
    const country = getCountryByIso3(iso3), value = getStatValue(iso3, URBAN);
    return country && value !== null ? [{ country, value }] : [];
  });
  if (places.length !== 2) return null;
  const winner = places[0].value > places[1].value ? places[0] : places[1];
  return <article className="urban-comparison">
    <h2 className="t-h3">{index + 1}. Which has the larger urban share?</h2>
    <div className="urban-pair">{places.map(({ country }) => <div key={country.iso3}><Flag iso2={country.iso2} size="m" alt="" /><b>{country.displayName}</b></div>)}</div>
    <details><summary>Reveal answer<ChevronRightIcon size={18} /></summary><div className="urban-answer">
      <p className="t-body"><b>{winner.country.displayName}</b> has the larger share.</p>
      {places.map(({ country, value }) => <p className="urban-value t-body" key={country.iso3}><Link href={`/countries/${country.slug}`}>{country.displayName}</Link><meter min={0} max={100} value={value} aria-label={`${country.displayName}: ${value.toFixed(1)} percent urban`} /><b>{value.toFixed(1)}%</b></p>)}
    </div></details>
  </article>;
}

export function UrbanGeography() {
  const urban = getCategoryBySlug(URBAN);
  const population = getCategoryBySlug('population');
  return <>
    <script {...jsonLdProps(graph([breadcrumbList([{ name: 'Home', path: '' }, { name: 'Practice', path: '/practice' }, { name: 'Urban geography', path: '/practice/urban-geography' }])]))} />
    <div className="urban-geography">
      <header className="urban-heading"><Clay object="cl-06" sizes="128px" loading="eager" /><h1 className="t-h1">How urban is the world?</h1><p className="t-body text-mute">Two comparisons. Then five questions on the ruler.</p><GamePlayLink slug="stat-guesser" href={`/games/stat-guesser/play?mode=practice&stat=${URBAN}`} prefetch className="btn btn-ink t-cta" pendingLabel="Opening…">Play urban population</GamePlayLink><p className="t-meta text-mute">Free practice · No account · {urban?.sourceYear} data</p></header>
      <div className="urban-comparisons">{COMPARISONS.map((pair, index) => <UrbanComparison key={pair[0]} pair={pair} index={index} />)}</div>
      <p className="t-body urban-takeaway">A larger percentage does not mean more people. A smaller country can have a higher urban share.</p>
      <section className="urban-next"><h2 className="t-h2">Try the other question</h2><p className="t-body text-mute">How many people live in each country?</p><GamePlayLink slug="stat-guesser" href="/games/stat-guesser/play?mode=practice&stat=population" className="btn btn-quiet t-cta" pendingLabel="Opening…">Play total population</GamePlayLink></section>
      <details className="urban-sources"><summary>Sources and classroom use<ChevronRightIcon size={18} /></summary><div className="urban-source-content t-body">
        <p>Urban share: {urban?.source}, {urban?.sourceYear}. Total population practice: {population?.source}, {population?.sourceYear}. These are dated datasets, not live population estimates.</p>
        <p>“Urban” follows each country’s national definition, so comparisons describe different settlement systems. They do not measure housing quality, city size or how well a country is doing. <a href="https://data.worldbank.org/indicator/SP.URB.TOTL.IN.ZS" target="_blank" rel="noreferrer">World Bank indicator and definition</a>.</p>
        <p>For a short classroom warm-up: predict the two comparisons, reveal, then ask why a percentage and a headcount can tell different stories. Continue with five practice questions.</p>
        <p><a href="https://www.un.org/en/observances/cities-day" target="_blank" rel="noreferrer">World Cities Day</a> falls on 31 October. This independent Countrivo exercise is a starting point for discussing urbanisation; it is not affiliated with the UN.</p>
        <p><Link href={`/categories/${URBAN}`}>Full urban-population ranking</Link> · <Link href="/categories/population">Total population ranking</Link> · <Link href="/sources">All data sources</Link></p>
      </div></details>
      <nav className="urban-links t-meta" aria-label="More geography practice"><Link href="/practice">All practice games</Link><Link href="/games/geo-wordle">Guess a country</Link><Link href="/games/country-draft">Draft a cabinet</Link></nav>
    </div><SiteFoot />
  </>;
}
