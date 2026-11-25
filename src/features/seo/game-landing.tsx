import Link from 'next/link';
import { getGameBySlug } from '@/lib/data/games';
import { getGameContent, relatedSlugs } from '@/content/games';
import { CABINET_JOBS, gamePresentation } from '@/content/table';
import { getGameCopy } from '@/lib/seo/game-copy';
import { buildGameJsonLd } from '@/lib/seo/game-metadata';
import { GameRow } from '@/ui/game-row';
import { isGameSlug } from '@/ui/types';
import { GamePlayLink } from '@/ui/game-play-link';
import { Clay, gameClayFrame } from '@/ui/clay';
import { QaList } from "@/ui/qa-list";
import { SiteFoot } from "@/ui/site-foot";
import { YesterdayAnswers } from '@/features/home/yesterday-answers';
import { getTodayDateKey } from '@/lib/daily-seed';
import { GameJsonLd } from './game-jsonld';
import { GeoWordleGuide } from './geo-wordle-guide';
import { faqPage, jsonLdProps, node } from './breadcrumbs';
import './seo.css';
import './game-landing.css';
import { GlobeIcon } from '@/ui/icons/globe';
import { UserIcon } from '@/ui/icons/user';
import { ChairIcon } from '@/ui/icons/seat';
import { PinIcon } from '@/ui/icons/pin';
import { CheckIcon } from '@/ui/icons/check';
import { TargetIcon } from '@/ui/icons/target';
import { TrophyIcon } from '@/ui/icons/trophy';
import { SearchIcon } from '@/ui/icons/search';
import { ArrowUpRightIcon } from '@/ui/icons/arrow-up-right';
import { TimerIcon } from '@/ui/icons/timer';
import { HashIcon } from '@/ui/icons/hash';
import type { GlyphProps } from '@/ui/icons/glyph';
import type { ReactNode } from 'react';

type StepIcon = (props: GlyphProps) => ReactNode;
/** The first Berlin day whose Flag Quiz daily is the twenty-second sprint; earlier frozen days keep the ten-flag quiz. */
const FLAG_SPRINT_FIRST_DAY = '2026-11-26';
/** Topic pages that answer a neighbouring search, linked once from the game they reuse. */
const topicLinks: Record<string, readonly { href: string; label: string }[]> = {
  'flag-quiz': [
    { href: '/practice/europe-flags', label: 'Flags of Europe' },
    { href: '/games/speed-flags', label: 'Speed Flags: thirty seconds, two names' },
  ],
  pinpoint: [{ href: '/world-map-quiz', label: 'World Map Quiz: unlimited blank-map rounds' }],
};
const stepIcons: Record<string, readonly [StepIcon, StepIcon, StepIcon]> = {
  'country-draft': [GlobeIcon, UserIcon, ChairIcon],
  'geo-wordle': [SearchIcon, ArrowUpRightIcon, TargetIcon],
  pinpoint: [GlobeIcon, PinIcon, CheckIcon],
  'flag-quiz': [GlobeIcon, CheckIcon, TrophyIcon],
  'higher-or-lower': [GlobeIcon, ArrowUpRightIcon, TrophyIcon],
  'stat-guesser': [HashIcon, PinIcon, TargetIcon],
  'blind-pick': [GlobeIcon, HashIcon, TargetIcon],
  'speed-flags': [TimerIcon, CheckIcon, TrophyIcon],
};

export async function GameLanding({slug}: {slug:string}) {
  const game = getGameBySlug(slug);
  const presentation = gamePresentation(slug);
  const content = getGameContent(slug);
  if(!game || !presentation || !content) return null;
  const daily = game.availableModes.includes('daily');
  const hero = gameClayFrame(presentation.clay, presentation.done);
  const copy = getGameCopy(slug);
  const jsonLd = buildGameJsonLd(slug);
  const faq = [
    {q:'Do I need an account?',a:'No. There is no login. Finish a daily game, then add a name to the leaderboard if you like.'},
    {q:'What is Par?',a:`Par ${presentation.par} is a good score to aim for. It is a reference score, not another player.`},
    daily ? {q:'When does the board reset?',a:'New daily boards arrive at midnight in Europe/Berlin. Everyone gets the same boards.'} : {q:'Is this a daily game?',a:'This game is practice only. Start a new run whenever you like; practice has no daily leaderboard.'},
    {q:'Can I practice?',a:'Yes. Practice gives you fresh boards and never changes the daily leaderboard.'},
    ...(copy?.faq ?? []).filter((item)=>!/(account|sign.in|leaderboard|reset|streak|practice)/i.test(item.q+' '+item.a)).slice(0, slug === 'flag-quiz' ? 5 : 3),
  ];
  const topics = topicLinks[slug] ?? [];
  const flagQuizBeforeSprint = slug === 'flag-quiz' && getTodayDateKey() < FLAG_SPRINT_FIRST_DAY;
  return <>
    <GameJsonLd name={jsonLd.name} title={jsonLd.title} description={jsonLd.description} url={jsonLd.url} genre={jsonLd.genre} playMode={jsonLd.playMode} />
    <script {...jsonLdProps(node(faqPage(faq)))} />
    <div className="game-landing-compact">
      <header className="landing-hero">
        <span className="landing-plate" data-game={slug}><Clay object={presentation.clay} state={hero.state} tone={hero.tone} alternate={hero.tone === 'original' ? presentation.idle : undefined} sizes="160px" loading="eager" /></span>
        <h1 className="t-h1">{copy?.heading ?? game.title}</h1>
        <p className="t-body text-mute">{presentation.promise}</p>
        <GamePlayLink slug={slug} href={`/games/${slug}/play?mode=${daily ? 'daily' : 'practice'}`} prefetch className="btn btn-primary t-cta landing-play" pendingLabel="Opening…">Play</GamePlayLink>
        <nav className="landing-links" aria-label={`${game.title} options`}>
          {daily ? <><Link href={`/games/${slug}/play?mode=practice`}>Practice</Link><Link href={`/games/${slug}/leaderboard`}>Leaderboard</Link><Link href={`/games/${slug}/archive`}>Archive</Link></> : <Link href="/practice">More practice games</Link>}
        </nav>
      </header>
      {copy?.lead ? <p className="landing-lead t-body">{copy.lead}</p> : null}
      {flagQuizBeforeSprint ? <p className="landing-lead t-meta text-mute">Today’s daily board still runs the earlier ten-flag quiz. The twenty-second sprint starts with the 26 November board at midnight Berlin time.</p> : null}
      <details className="landing-details disclose" open>
        <summary>How to play</summary>
        <ol className="landing-steps">{presentation.steps.map((step, i)=>{const Icon=stepIcons[slug]?.[i] ?? CheckIcon;return <li key={step}><Icon size={28} /><span>{step}</span></li>;})}</ol>
        <details className="landing-scoring disclose"><summary>Scoring</summary><ul>{content.rules.map((rule)=><li key={rule}>{rule}</li>)}</ul>
          {slug === 'country-draft' ? <div className="job-guide">{CABINET_JOBS.map((job)=><div key={job.slug}><Clay object={job.clay} sizes="72px" /><span><b>{job.name}</b><small>{job.description}</small></span></div>)}</div> : null}
        </details>
      </details>
      {slug === 'geo-wordle' ? <details className="landing-details disclose"><summary>See an example</summary><GeoWordleGuide /></details> : null}
      {copy && (slug === 'geo-wordle' || slug === 'country-draft') ? <details className="landing-details disclose"><summary>About {game.title}</summary><div className="landing-about t-body"><p>{copy.about[0]}</p>{slug === 'country-draft' ? <p>One country, one person, one free job per round. You see the points after confirming. <Link href="/games/blind-pick">Prefer drafting countries onto statistics? Try Blind Pick.</Link></p> : <p><Link href="/countries">Explore countries and neighbours</Link> or <Link href="/games/pinpoint">find countries on a blank map</Link>.</p>}</div></details> : null}
      <details className="landing-details disclose"><summary>Questions</summary><QaList open="details" items={faq} /></details>
      {daily ? <details className="landing-details disclose"><summary>Yesterday’s answers</summary><YesterdayAnswers slug={slug} /></details> : null}
      {topics.length ? <nav className="landing-topic t-body" aria-label={`More ways to play ${game.title}`}>{topics.map((topic)=><Link key={topic.href} href={topic.href}>{topic.label}</Link>)}</nav> : null}
      <section className="landing-more ls"><h2 className="t-h2">More games</h2>{relatedSlugs(slug).map((other)=>{const g=gamePresentation(other);return g && isGameSlug(g.slug) ? <GameRow key={g.slug} slug={g.slug} title={g.title} meta={g.action} href={`/games/${g.slug}`} /> : null;})}</section>
    </div>
    <SiteFoot />
  </>;
}
