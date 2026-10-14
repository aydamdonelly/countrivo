import Link from 'next/link';
import { ChevronRightIcon } from '@/ui/icons/chevron-right';
import { getGameBySlug } from '@/lib/data/games';
import { getGameContent, relatedSlugs } from '@/content/games';
import { CABINET_JOBS, gamePresentation } from '@/content/table';
import { getGameCopy } from '@/lib/seo/game-copy';
import { buildGameJsonLd } from '@/lib/seo/game-metadata';
import { GameCard } from '@/ui/game-card';
import { Clay } from '@/ui/clay';
import { QaList } from "@/ui/qa-list";
import { SiteFoot } from "@/ui/site-foot";
import { getTodayDateKey } from '@/lib/daily-seed';
import { DailyTable } from '@/features/home/daily-table';
import { YesterdayAnswers } from '@/features/home/yesterday-answers';
import { GameJsonLd } from './game-jsonld';
import { faqPage, jsonLdProps, node } from './breadcrumbs';
import './seo.css';

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
    {q:'When does the board reset?',a:'New daily boards arrive at midnight in Europe/Berlin. Everyone gets the same boards.'},
    {q:'Can I practice?',a:'Yes. Practice gives you fresh boards and never changes the daily leaderboard.'},
    ...(copy?.faq ?? []).filter((item)=>!/(account|sign.in|leaderboard|reset|streak|practice)/i.test(item.q+' '+item.a)).slice(0,3),
  ];
  return <>
    <GameJsonLd name={jsonLd.name} title={jsonLd.title} description={jsonLd.description} url={jsonLd.url} genre={jsonLd.genre} playMode={jsonLd.playMode} />
    <script {...jsonLdProps(node(faqPage(faq)))} />
    <div className="landing-stage"><GameCard game={presentation} practice={!daily} heading="h1" /></div>
    <div className="table-editorial">
      <p className="t-meta text-mute">Free, no account. {daily ? 'New board every day.' : 'Unlimited practice.'}</p>
      <section><h2 className="t-h2">How it works</h2>{content.rules.map((rule)=><p className="t-body" key={rule}>{rule}</p>)}
        {slug === 'country-draft' ? <div className="job-guide">{CABINET_JOBS.map((job)=><div key={job.slug}><Clay object={job.clay} /><span><b>{job.name}</b><small>{job.description}</small></span></div>)}</div> : null}
      </section>
      {daily ? <section><h2 className="t-h2">Today on {game.title}</h2><DailyTable slug={slug} dateKey={getTodayDateKey()} /><Link href={`/games/${slug}/leaderboard`} className="table-link">See the leaderboard</Link><Link href={`/games/${slug}/play?mode=practice`} className="table-link">Play a practice board</Link></section> : null}
      {daily ? <YesterdayAnswers slug={slug} /> : null}
      <section><h2 className="t-h2">Questions</h2><QaList open="details" items={faq} /></section>
      <section><h2 className="t-h2">More games</h2>{relatedSlugs(slug).map((other)=>{const g=gamePresentation(other);return g ? <Link className="table-next-row" href={`/games/${g.slug}`} key={g.slug}><Clay object={g.clay} state={g.clay === 'cl-08' ? 'full' : 'rest'} /><span>{g.title}<small className="t-meta">{g.minutes}</small></span><ChevronRightIcon size={20} /></Link> : null;})}</section>
      {daily ? <Link href={`/games/${slug}/archive`} className="table-link"><Clay object="cl-23" state="open" /><span>Play past boards<small className="block t-meta text-mute">Free, never ranked.</small></span></Link> : null}
    </div>
    <SiteFoot />
  </>;
}
