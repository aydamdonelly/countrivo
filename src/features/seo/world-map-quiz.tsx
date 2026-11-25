import Link from 'next/link';
import { getAllCountries } from '@/lib/data/countries';
import { sovereignIso3 } from '@/lib/data/loader';
import { PINPOINT_FULL_KM, PINPOINT_ZERO_KM, pinpointPoints } from '@/lib/game-logic/pinpoint/scoring';
import { PINPOINT_MAX, PINPOINT_ROUNDS } from '@/lib/game-logic/pinpoint/engine';
import { gamePresentation } from '@/content/table';
import { Clay, gameClayFrame } from '@/ui/clay';
import { GamePlayLink } from '@/ui/game-play-link';
import { GameRow } from '@/ui/game-row';
import { QaList } from '@/ui/qa-list';
import { SiteFoot } from '@/ui/site-foot';
import { Table } from '@/ui/table';
import { GlobeIcon } from '@/ui/icons/globe';
import { PinIcon } from '@/ui/icons/pin';
import { TargetIcon } from '@/ui/icons/target';
import { breadcrumbList, faqPage, graph, jsonLdProps } from './breadcrumbs';
import { WorldMap } from './world-map';
import './game-landing.css';
import './world-map-quiz.css';

const PRACTICE_HREF = '/games/pinpoint/play?mode=practice';
const CONTINENT_LISTS = [
  { slug: 'countries-in-africa', name: 'Africa', continent: 'Africa' },
  { slug: 'countries-in-americas', name: 'The Americas', continent: 'Americas' },
  { slug: 'countries-in-asia', name: 'Asia', continent: 'Asia' },
  { slug: 'countries-in-europe', name: 'Europe', continent: 'Europe' },
  { slug: 'countries-in-oceania', name: 'Oceania', continent: 'Oceania' },
] as const;

const km = (value: number) => `${value.toLocaleString('en-US')} km`;

/** Worked examples from the scoring module Pinpoint itself uses, so the page cannot drift from the game. */
const SCORE_EXAMPLES = [
  { pin: `Inside the country, or within ${PINPOINT_FULL_KM} km of it`, points: pinpointPoints(0, 0) },
  { pin: `${km(300)} away, no other country nearer your pin`, points: pinpointPoints(300, 0) },
  { pin: `${km(1000)} away, no other country nearer your pin`, points: pinpointPoints(1000, 0) },
  { pin: `${km(1000)} away, three other countries nearer your pin`, points: pinpointPoints(1000, 3) },
  { pin: `${km(PINPOINT_ZERO_KM)} or more away`, points: pinpointPoints(PINPOINT_ZERO_KM, 0) },
];

function worldMapQuizFaq(countries: number): { q: string; a: string }[] {
  return [
    { q: 'Is the World Map Quiz free?', a: 'Yes. It is free in your browser on a phone, tablet or computer, with no account and no download. Start a new round of five countries as often as you like.' },
    { q: 'How is the World Map Quiz scored?', a: `Each round is ${PINPOINT_ROUNDS} countries. A pin inside the country or within ${PINPOINT_FULL_KM} km of it scores 200. Otherwise distance is worth up to 170, falling to nothing at ${km(PINPOINT_ZERO_KM)}, and every other country nearer your pin than the target lowers that ceiling by 30. The fifth country counts double, so the maximum is ${PINPOINT_MAX.toLocaleString('en-US')}.` },
    { q: 'Which countries can come up?', a: `Any of the ${countries} sovereign states on the Countrivo map. The first four in a round are large countries, the first three from different world regions. The fifth can be any of them, small island states included.` },
    { q: 'Can I quiz one continent at a time?', a: 'Not yet. Every round uses the whole world map. To study one region first, open the country lists by continent below, then come back to the blank map.' },
    { q: 'Is there a daily world map quiz?', a: 'Yes. Pinpoint is the daily version: the same five countries for everyone each day, with a leaderboard and a new board at midnight Berlin time. The World Map Quiz rounds here are separate and never change the daily board.' },
  ];
}

export function WorldMapQuiz() {
  const pinpoint = gamePresentation('pinpoint');
  const hero = pinpoint ? gameClayFrame(pinpoint.clay, pinpoint.done) : null;
  const countries = getAllCountries().filter(country => sovereignIso3.includes(country.iso3));
  const faq = worldMapQuizFaq(sovereignIso3.length);
  const steps = [
    { Icon: GlobeIcon, text: 'You get the name of a country and a blank world map.' },
    { Icon: PinIcon, text: 'Drop your pin where you think it is, then confirm.' },
    { Icon: TargetIcon, text: 'See where it really is and how far off you were.' },
  ];
  return <>
    <script {...jsonLdProps(graph([breadcrumbList([{ name: 'Home', path: '' }, { name: 'World Map Quiz', path: '/world-map-quiz' }]), faqPage(faq)]))} />
    <div className="game-landing-compact map-quiz">
      <header className="landing-hero">
        {pinpoint && hero ? <span className="landing-plate" data-game="pinpoint"><Clay object={pinpoint.clay} state={hero.state} tone={hero.tone} alternate={hero.tone === 'original' ? pinpoint.idle : undefined} sizes="160px" loading="eager" /></span> : null}
        <h1 className="t-h1">World Map Quiz</h1>
        <p className="t-body text-mute">Find countries on a blank world map. No borders, no labels.</p>
        <GamePlayLink slug="pinpoint" href={PRACTICE_HREF} prefetch className="btn btn-primary t-cta landing-play" pendingLabel="Opening…">Start the map quiz</GamePlayLink>
        <p className="t-meta text-mute map-quiz-meta">Five countries a round · Unlimited rounds · No account</p>
      </header>
      <p className="landing-lead t-body">The World Map Quiz is a free geography game where you place countries on a blank world map. You see a country’s name, drop a pin where you think it is, and score more the closer you land. A round is five countries, and you can start a new one whenever you like. It runs on the same map and scoring as Pinpoint, Countrivo’s daily map game.</p>
      <section className="map-quiz-section" aria-labelledby="map-quiz-how">
        <h2 id="map-quiz-how" className="t-h2">How to play</h2>
        <ol className="landing-steps">{steps.map(({ Icon, text }) => <li key={text}><Icon size={28} /><span>{text}</span></li>)}</ol>
        <p className="t-body map-quiz-note">The fifth country counts double. After each pin the map shows where the country really is, names some of its neighbours and gives the distance from your pin.</p>
      </section>
      <section className="map-quiz-section" aria-labelledby="map-quiz-score">
        <h2 id="map-quiz-score" className="t-h2">How close is close enough</h2>
        <p className="t-body map-quiz-note">Points for one country, worked out with the same scoring the game uses:</p>
        <Table caption="World Map Quiz points for one country by where the pin lands" columns={[{ key: 'pin', label: 'Your pin' }, { key: 'points', label: 'Points', value: true }]} rows={SCORE_EXAMPLES.map(row => ({ pin: row.pin, points: row.points }))} />
        <p className="t-meta text-mute map-quiz-note">A country nearer your pin than the target is a sign you put it in the wrong place, so each one lowers the most that pin can earn by 30.</p>
      </section>
      <section className="map-quiz-section" aria-labelledby="map-quiz-study">
        <h2 id="map-quiz-study" className="t-h2">Study the map first</h2>
        <p className="t-body map-quiz-note">Every country on this map links to its own page with its capital, neighbours and world rankings.</p>
        <WorldMap />
        <nav className="map-quiz-links" aria-label="Countries by continent">{CONTINENT_LISTS.map(list => <Link key={list.slug} href={`/lists/${list.slug}`}>{list.name}<span className="t-meta text-mute">{countries.filter(country => country.continent === list.continent).length} countries</span></Link>)}</nav>
        <p className="t-meta text-mute map-quiz-note"><Link href="/countries">All countries and territories</Link></p>
      </section>
      <section className="map-quiz-section" aria-labelledby="map-quiz-faq">
        <h2 id="map-quiz-faq" className="t-h2">Questions</h2>
        <QaList open="details" items={faq} />
      </section>
      <section className="landing-more ls">
        <h2 className="t-h2">Play on</h2>
        <GameRow slug="pinpoint" title="Pinpoint daily" meta="The same five countries for everyone today" href="/games/pinpoint" />
        <GameRow slug="geo-wordle" title="GeoWordle" meta="Find a hidden country with distance and direction" href="/games/geo-wordle" />
        <GameRow slug="flag-quiz" title="Flag Quiz" meta="Twenty seconds to name as many flags as you can" href="/games/flag-quiz" />
      </section>
      <GamePlayLink slug="pinpoint" href={PRACTICE_HREF} className="btn btn-secondary t-cta map-quiz-again" pendingLabel="Opening…">Start the map quiz</GamePlayLink>
    </div>
    <SiteFoot />
  </>;
}
