import Link from 'next/link';
import { listArchivedBoards } from '@/server/board-snapshots';
import { gamePresentation, TABLE_GAMES } from '@/content/table';
import { Clay, gameClayFrame } from '@/ui/clay';
import { SiteFoot } from '@/ui/site-foot';
import { getDailyGames } from '@/lib/data/registry';
const DAILY_SLUGS=new Set(getDailyGames().map((g)=>g.slug));
/** Every day lists its boards in the home order, so a game sits in the same place day after day. */
const ORDER: readonly string[]=TABLE_GAMES.map((g)=>g.slug);
export async function ArchivePage({slug}: {slug?:string}) {
  const boards=await listArchivedBoards(slug);
  const game=slug ? gamePresentation(slug) : undefined;
  const days=[...new Set(boards.map((board)=>board.date_key))];
  const dayLabel=(dateKey:string)=>new Date(`${dateKey}T12:00:00Z`).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).replace(',','');
  return <><div className="system-page archive-page"><Clay object="cl-23" state="open" /><h1 className="t-h1">{game ? `Past ${game.title} boards` : 'Past boards'}</h1><p className="t-body text-mute mt-4">The daily archive starts with this relaunch. Every board stays as it was played. Free, never ranked.</p>
    {!slug ? <nav className="archive-filter" aria-label="Browse by game">{TABLE_GAMES.filter((g)=>DAILY_SLUGS.has(g.slug)).map((g)=><Link key={g.slug} href={`/games/${g.slug}/archive`} data-game={g.slug}><span className="archive-filter-dot" aria-hidden="true" />{g.title}</Link>)}</nav> : null}
    {boards.length ? <div className="mt-8">{days.map((day)=><section className="archive-day" key={day} aria-label={dayLabel(day)}><h2 className="archive-day-head">{dayLabel(day)}</h2>{boards.filter((board)=>board.date_key===day).sort((a,b)=>ORDER.indexOf(a.game_slug)-ORDER.indexOf(b.game_slug)).map((board)=>{const g=gamePresentation(board.game_slug);return <Link className="archive-row" key={`${board.game_slug}:${board.date_key}:${board.edition}`} href={`/games/${board.game_slug}/play?date=${board.date_key}`} aria-label={`Play ${g?.title ?? 'this board'}, ${dayLabel(day)}`}>{g ? <Clay object={g.clay} {...gameClayFrame(g.clay, g.done)} /> : <Clay object="cl-23" />}<span>{g?.title}</span><span className="archive-play">Play</span></Link>;})}</section>)}</div> : <p className="t-body mt-8">Today&apos;s boards join the archive after midnight. Until then, there is plenty to practice.</p>}
    <Link href="/practice" className="btn btn-secondary mt-6">Practice instead</Link></div><SiteFoot /></>;
}
