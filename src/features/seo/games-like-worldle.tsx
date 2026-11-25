import Link from 'next/link';
import { GameRow } from '@/ui/game-row';
import { QaList } from '@/ui/qa-list';
import { SiteFoot } from '@/ui/site-foot';
import { GlobeIcon } from '@/ui/icons/globe';
import type { GameSlug } from '@/ui/types';
import { breadcrumbList, faqPage, graph, jsonLdProps, SITE_URL } from './breadcrumbs';
import './games-like-worldle.css';

const PATH = '/games-like-worldle';
/** The day every row below was read off the game's own site, help text or official app listing. */
const CHECKED_ON = '2026-11-25';
const CHECKED_LABEL = '25 November 2026';

interface ComparedGame {
  name: string;
  maker: string;
  /** Official site for another studio's game, a Countrivo path for ours. */
  href: string;
  external: boolean;
  what: string;
  when: string;
  account: string;
  where: string;
}

/**
 * Facts only as each official source stated them on CHECKED_ON: worldle.teuteuf.fr (FAQ),
 * globle-game.com (its How to Play and settings text), travle.earth and travle.earth/extra_info,
 * geoguessr.com/seterra and a Seterra quiz page, the App Store listings. No rankings, no
 * popularity claims, no logos.
 */
const GAMES: readonly ComparedGame[] = [
  {
    name: 'Worldle', maker: 'Teuteuf Games', href: 'https://worldle.teuteuf.fr/', external: true,
    what: 'Guess the country or territory from its silhouette in six tries. Each guess shows the distance, a direction and how close you are as a percentage.',
    when: 'A new puzzle every day at midnight, and a practice mode. Past puzzles need a Premium membership.',
    account: 'Not for the daily. The archive needs a Teuteuf Games account.',
    where: 'Web, iOS and Android apps',
  },
  {
    name: 'Globle', maker: 'Trainwreck Labs', href: 'https://globle-game.com/', external: true,
    what: 'Guess the mystery country in as few guesses as you can. Each wrong guess appears on a globe, and the hotter its colour, the closer you are.',
    when: 'A new mystery country every day, plus practice games.',
    account: 'Optional, to back up your stats.',
    where: 'Web',
  },
  {
    name: 'Travle', maker: 'Teuteuf Games', href: 'https://travle.earth/', external: true,
    what: 'Travel from one country to another by naming the countries in between. You get the length of the shortest route plus three to eight extra guesses.',
    when: 'A daily route, a weekly challenge every Monday and a practice mode.',
    account: 'Not for the daily.',
    where: 'Web. Its help page says there is no dedicated app; you can add it to your home screen.',
  },
  {
    name: 'Seterra', maker: 'GeoGuessr', href: 'https://www.geoguessr.com/seterra', external: true,
    what: 'Over 400 customizable map quizzes on countries, capitals, flags and more, in more than 40 languages.',
    when: 'Any quiz, any time.',
    account: 'Not to play. Log in to save your results.',
    where: 'Web, iOS and Android apps',
  },
  {
    name: 'GeoWordle', maker: 'Countrivo', href: '/games/geo-wordle', external: false,
    what: 'Guess the hidden country in six tries from the distance and direction of each guess. There is no silhouette to start; an outline clue is optional and costs a guess.',
    when: 'Daily, unlimited practice and a free archive of past days.',
    account: 'None. Countrivo has no accounts.',
    where: 'Web, iPhone and iPad app',
  },
  {
    name: 'Pinpoint', maker: 'Countrivo', href: '/games/pinpoint', external: false,
    what: 'Place five named countries on a blank world map. Closer pins score more, and the fifth counts double.',
    when: 'Daily, unlimited practice and a free archive of past days.',
    account: 'None. Countrivo has no accounts.',
    where: 'Web, iPhone and iPad app',
  },
  {
    name: 'Country Draft', maker: 'Countrivo', href: '/games/country-draft', external: false,
    what: 'Five rounds: choose one of three countries, one of its famous people and a cabinet job for them. A perfect cabinet scores 195.',
    when: 'Daily, practice and a free archive of past days.',
    account: 'None. Countrivo has no accounts.',
    where: 'Web, iPhone and iPad app',
  },
];

const FAQ: readonly { q: string; a: string }[] = [
  { q: 'What is the best game like Worldle?', a: 'It depends on what you like about Worldle. For the same daily guess-the-country idea, try Globle or GeoWordle. For a route puzzle from the studio behind Worldle, try Travle. For map quizzes without a daily limit, try Seterra.' },
  { q: 'Are there games like Worldle you can play unlimited?', a: 'Yes. Seterra quizzes can be played any time, Globle and Travle have practice modes, and GeoWordle and Pinpoint on Countrivo have unlimited practice next to the daily puzzle.' },
  { q: 'Do I need an account to play games like Worldle?', a: 'Not for the daily puzzles listed here. Worldle needs a Teuteuf Games account and Premium for past puzzles, and Globle and Seterra use sign-in to save stats or results. Countrivo has no accounts at all, and its archives are free.' },
  { q: 'How is GeoWordle different from Worldle?', a: 'Both give you six guesses with a distance and a direction after each one. Worldle starts with the country’s silhouette. GeoWordle starts with only a world map; after two misses you can spend a guess to see the outline.' },
];

const PICKS: readonly { title: string; body: string }[] = [
  { title: 'The same idea, different clues', body: 'Globle colours each guess on a globe instead of giving a distance. GeoWordle keeps the six guesses, distance and direction, without the silhouette.' },
  { title: 'Many rounds in one sitting', body: 'Seterra’s quizzes have no daily limit. On Countrivo, GeoWordle practice and the World Map Quiz deal a new round whenever you finish one.' },
  { title: 'A different daily puzzle', body: 'Travle turns countries into a route to find. Pinpoint asks where five countries are on a blank map, and Country Draft is a strategy game about people and their countries.' },
];

const PLAY_ON: readonly { slug: GameSlug; title: string; meta: string; href: string }[] = [
  { slug: 'geo-wordle', title: 'GeoWordle', meta: 'Six guesses, distance and direction', href: '/games/geo-wordle' },
  { slug: 'pinpoint', title: 'Pinpoint', meta: 'Five countries on a blank map', href: '/games/pinpoint' },
  { slug: 'country-draft', title: 'Country Draft', meta: 'Draft five people, score up to 195', href: '/games/country-draft' },
  { slug: 'flag-quiz', title: 'Flag Quiz', meta: 'Name as many flags as you can, fast', href: '/games/flag-quiz' },
];

function jsonLd(): object {
  const url = `${SITE_URL}${PATH}`;
  return graph([
    breadcrumbList([{ name: 'Home', path: '' }, { name: 'Games like Worldle', path: PATH }]),
    { '@type': 'WebPage', '@id': url, url, name: 'Games like Worldle', dateModified: CHECKED_ON, inLanguage: 'en' },
    {
      '@type': 'ItemList',
      name: 'Games like Worldle',
      numberOfItems: GAMES.length,
      itemListElement: GAMES.map((game, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: game.name,
        url: game.external ? game.href : `${SITE_URL}${game.href}`,
      })),
    },
    faqPage(FAQ),
  ]);
}

function GameName({ game }: { game: ComparedGame }) {
  return <>
    {game.external
      ? <a href={game.href} target="_blank" rel="noopener noreferrer">{game.name}</a>
      : <Link href={game.href}>{game.name}</Link>}
    <small className="t-meta text-mute">{game.maker}</small>
  </>;
}

export function GamesLikeWorldle() {
  return <>
    <script {...jsonLdProps(jsonLd())} />
    <div className="worldle-alts">
      <header className="worldle-alts-head">
        <h1 className="t-h1">Games like Worldle</h1>
        <p className="t-body worldle-alts-answer">The closest games to Worldle are Globle, Travle and Seterra. Globle is also a daily guess-the-country game, but it colours each guess on a globe instead of showing a silhouette. Travle, from the same studio as Worldle, asks you to connect two countries. Seterra has hundreds of map quizzes you can play any time. On Countrivo, GeoWordle is the nearest match: six guesses with distance and direction, no silhouette to start, unlimited practice and a free archive.</p>
        <p className="t-meta text-mute">Checked <time dateTime={CHECKED_ON}>{CHECKED_LABEL}</time> on each game’s own site</p>
      </header>

      <section className="worldle-alts-section" aria-labelledby="compare">
        <h2 id="compare" className="t-h2">Worldle and similar games compared</h2>
        <div className="worldle-alts-table">
          <table className="tbl t-row">
            <caption className="sr-only">Games like Worldle: what you do, when you can play, whether you need an account and where it runs</caption>
            <thead><tr><th scope="col" className="t-meta">Game</th><th scope="col" className="t-meta">What you do</th><th scope="col" className="t-meta">When you can play</th><th scope="col" className="t-meta">Account</th><th scope="col" className="t-meta">Where</th></tr></thead>
            <tbody>{GAMES.map(game => <tr key={game.name} data-own={game.external ? undefined : 'true'}>
              <th scope="row" className="worldle-alts-name"><GameName game={game} /></th>
              <td data-label="What you do">{game.what}</td>
              <td data-label="When you can play">{game.when}</td>
              <td data-label="Account">{game.account}</td>
              <td data-label="Where">{game.where}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <p className="t-meta text-mute worldle-alts-note">Worldle, Globle, Travle and Seterra belong to their makers and are not part of Countrivo. Links open their official sites.</p>
      </section>

      <section className="worldle-alts-section" aria-labelledby="pick">
        <h2 id="pick" className="t-h2">Which one to try next</h2>
        <div className="worldle-alts-picks">{PICKS.map(pick => <div key={pick.title}><h3 className="t-h3">{pick.title}</h3><p className="t-body">{pick.body}</p></div>)}</div>
        <p className="t-body worldle-alts-note">More map practice: <Link href="/world-map-quiz">the World Map Quiz</Link> deals five countries a round on a blank map.</p>
      </section>

      <section className="worldle-alts-section" aria-labelledby="method">
        <h2 id="method" className="t-h2">How we checked</h2>
        <p className="t-body worldle-alts-note">On {CHECKED_LABEL} we opened each game’s official site, its help or FAQ text and, where it has one, its official app listing, and wrote down only what they state. We did not rate difficulty or popularity. Games change, so if a row is out of date, <Link href="/feedback">tell us</Link> and we will correct it.</p>
      </section>

      <section className="worldle-alts-section" aria-labelledby="faq">
        <h2 id="faq" className="t-h2">Questions</h2>
        <QaList open="details" items={FAQ} />
      </section>

      <section className="worldle-alts-section ls" aria-labelledby="play">
        <h2 id="play" className="t-h2">Play on Countrivo</h2>
        {PLAY_ON.map(game => <GameRow key={game.slug} slug={game.slug} title={game.title} meta={game.meta} href={game.href} />)}
        <GameRow href="/world-map-quiz" title="World Map Quiz" meta="Unlimited rounds on a blank map" lead={<GlobeIcon size={24} />} />
      </section>
    </div>
    <SiteFoot />
  </>;
}
