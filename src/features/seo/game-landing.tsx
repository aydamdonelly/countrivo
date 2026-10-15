import Link from 'next/link';
import { ChevronRightIcon } from '@/ui/icons/chevron-right';
import { getGameBySlug } from '@/lib/data/games';
import { getGameContent, relatedSlugs } from '@/content/games';
import { CABINET_JOBS, gamePresentation } from '@/content/table';
import { getGameCopy } from '@/lib/seo/game-copy';
import { buildGameJsonLd } from '@/lib/seo/game-metadata';
import { GameCard } from '@/ui/game-card';
import { GamePlayLink } from '@/ui/game-play-link';
import { Clay } from '@/ui/clay';
import { QaList } from "@/ui/qa-list";
import { SiteFoot } from "@/ui/site-foot";
import { YesterdayAnswers } from '@/features/home/yesterday-answers';
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
  const copy = getGameCopy(slug);
  const jsonLd = buildGameJsonLd(slug);
  const faq = [
    {q:'Do I need an account?',a:'No. There is no login. Finish a daily game, then add a name to the leaderboard if you like.'},
    {q:'What is Par?',a:`Par ${presentation.par} is a good score to aim for. It is a reference score, not another player.`},
    daily ? {q:'When does the board reset?',a:'New daily boards arrive at midnight in Europe/Berlin. Everyone gets the same boards.'} : {q:'Is this a daily game?',a:'This game is practice only. Start a new run whenever you like; practice has no daily leaderboard.'},
    {q:'Can I practice?',a:'Yes. Practice gives you fresh boards and never changes the daily leaderboard.'},
    ...(copy?.faq ?? []).filter((item)=>!/(account|sign.in|leaderboard|reset|streak|practice)/i.test(item.q+' '+item.a)).slice(0,3),
  ];
  return <>
    <GameJsonLd name={jsonLd.name} title={jsonLd.title} description={jsonLd.description} url={jsonLd.url} genre={jsonLd.genre} playMode={jsonLd.playMode} />
    <script {...jsonLdProps(node(faqPage(faq)))} />
    <div className="game-landing-compact">
      <header className="landing-hero">
        <Clay object={presentation.clay} state={presentation.clay === 'cl-08' ? 'full' : 'rest'} alternate={presentation.idle} sizes="160px" loading="eager" />
        <h1 className="t-h1">{game.title}</h1>
        <p className="t-body text-mute">{presentation.promise}</p>
        <GamePlayLink slug={slug} href={`/games/${slug}/play?mode=${daily ? 'daily' : 'practice'}`} prefetch className="btn btn-ink t-cta landing-play" pendingLabel="Opening…">Play</GamePlayLink>
        <nav className="landing-links t-meta" aria-label={`${game.title} options`}>
          {daily ? <><Link href={`/games/${slug}/play?mode=practice`}>Practice</Link><Link href={`/games/${slug}/leaderboard`}>Leaderboard</Link><Link href={`/games/${slug}/archive`}>Archive</Link></> : <Link href="/practice">More practice games</Link>}
        </nav>
      </header>
      <details className="landing-details">
        <summary>How to play<ChevronRightIcon size={18} /></summary>
        <ol className="landing-steps">{presentation.steps.map((step, i)=>{const Icon=stepIcons[slug]?.[i] ?? CheckIcon;return <li key={step}><Icon size={28} /><span>{step}</span></li>;})}</ol>
        <details className="landing-scoring"><summary>Scoring<ChevronRightIcon size={18} /></summary><ul>{content.rules.map((rule)=><li key={rule}>{rule}</li>)}</ul>
          {slug === 'country-draft' ? <div className="job-guide">{CABINET_JOBS.map((job)=><div key={job.slug}><Clay object={job.clay} sizes="72px" /><span><b>{job.name}</b><small>{job.description}</small></span></div>)}</div> : null}
        </details>
      </details>
      {slug === 'geo-wordle' ? <details className="landing-details"><summary>See an example<ChevronRightIcon size={18} /></summary><GeoWordleGuide /></details> : null}
      {copy && (slug === 'geo-wordle' || slug === 'country-draft') ? <details className="landing-details"><summary>About {game.title}<ChevronRightIcon size={18} /></summary><div className="landing-about t-body"><p>{copy.about[0]}</p>{slug === 'country-draft' ? <p>One country, one person, one free job per round. You see the points after confirming. <Link href="/games/blind-pick">Prefer drafting countries onto statistics? Try Blind Pick.</Link></p> : <p><Link href="/countries">Explore countries and neighbours</Link> or <Link href="/games/pinpoint">find countries on a blank map</Link>.</p>}</div></details> : null}
      <details className="landing-details"><summary>Questions<ChevronRightIcon size={18} /></summary><QaList open="details" items={faq} /></details>
      {daily ? <details className="landing-details"><summary>Yesterday’s answers<ChevronRightIcon size={18} /></summary><YesterdayAnswers slug={slug} /></details> : null}
      {slug === 'flag-quiz' ? <p className="landing-topic t-body"><Link href="/practice/europe-flags">Practise just the flags of Europe</Link></p> : null}
      <section className="landing-more"><h2 className="t-h2">More games</h2><div className="landing-game-grid">{relatedSlugs(slug).map((other)=>{const g=gamePresentation(other);return g ? <GameCard key={g.slug} game={g} active={false} practice={!getGameBySlug(g.slug)?.availableModes.includes('daily')} /> : null;})}</div></section>
    </div>
    <SiteFoot />
  </>;
}
