import Link from 'next/link';
import { getAllCountries, getCountryByIso3 } from '@/lib/data/countries';
import { sovereignIso3 } from '@/lib/data/loader';
import { Clay } from '@/ui/clay';
import { Flag } from '@/ui/flag';
import { GamePlayLink } from '@/ui/game-play-link';
import { SiteFoot } from '@/ui/site-foot';
import { ChevronRightIcon } from '@/ui/icons/chevron-right';
import { breadcrumbList, graph, jsonLdProps } from './breadcrumbs';
import './europe-flags.css';

export function EuropeFlags() {
  const countries = getAllCountries().filter(country => country.continent === 'Europe' && sovereignIso3.includes(country.iso3));
  return <>
    <script {...jsonLdProps(graph([breadcrumbList([{ name: 'Home', path: '' }, { name: 'Practice', path: '/practice' }, { name: 'Europe flags', path: '/practice/europe-flags' }])]))} />
    <div className="europe-practice">
      <header className="europe-practice-hero"><Clay object="cl-05" alternate="wave1" sizes="128px" loading="eager" /><h1 className="t-h1">Flags of Europe</h1><p className="t-body text-mute">Ten flags. Four names each. All from Europe.</p><GamePlayLink slug="flag-quiz" href="/games/flag-quiz/play?mode=practice&region=europe" prefetch className="btn btn-ink t-cta" pendingLabel="Opening…">Play Europe flags</GamePlayLink><p className="t-meta text-mute">Unlimited practice · No account</p></header>
      <div className="europe-practice-preview" aria-label="Examples of flags in the European pool">{['FRA', 'DEU', 'ITA', 'NOR', 'POL', 'GRC'].map(iso3 => { const country = getCountryByIso3(iso3); return country ? <div key={iso3}><Flag iso2={country.iso2} size="m" alt="" /><span className="t-meta">{country.displayName}</span></div> : null; })}</div>
      <details className="europe-practice-about"><summary>Which flags and how is it scored?<ChevronRightIcon size={18} /></summary><div className="t-body"><p>The pool contains {countries.length} sovereign states classified as Europe in Countrivo’s geography data. Territories are excluded. Transcontinental countries follow the same regional classification as our country directory.</p><p>Every flag and all four answer options come from that pool. Flags 1 to 7 score one point each; 8 to 10 score two. A perfect run is 13 points. A new practice round gives you another set, and the daily leaderboard is separate.</p><p>Today’s daily answer flags are left out of the practice pool. <Link href="/lists/countries-in-europe">See the European country list</Link> or <Link href="/sources">check our sources and definitions</Link>.</p></div></details>
      <nav className="europe-practice-links t-meta" aria-label="More flag games"><Link href="/games/flag-quiz">Today’s worldwide Flag Quiz</Link><Link href="/games/speed-flags">30-second Speed Flags</Link><Link href="/practice/urban-geography">Urban population quiz</Link><Link href="/practice">All practice games</Link></nav>
    </div><SiteFoot />
  </>;
}
