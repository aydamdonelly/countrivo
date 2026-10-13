import Link from 'next/link';
import { listArchivedBoards } from '@/server/board-snapshots';
import { gamePresentation, TABLE_GAMES } from '@/content/table';
import { Clay } from '@/ui/clay';
import { SiteFoot } from '@/ui/site-foot';
export async function ArchivePage({slug}: {slug?:string}) {
  const boards=await listArchivedBoards(slug);
  const game=slug ? gamePresentation(slug) : undefined;
  return <><div className="system-page"><Clay object="cl-23" state="open" /><h1 className="t-h1">{game ? `Past ${game.title} boards` : 'Past boards'}</h1><p className="t-body text-mute mt-4">The daily archive starts with this relaunch. Every board stays as it was played. Free, never ranked.</p>{boards.length ? <div className="mt-8">{boards.map((board)=>{const g=gamePresentation(board.game_slug);return <Link className="archive-row" key={`${board.game_slug}:${board.date_key}:${board.edition}`} href={`/games/${board.game_slug}/play?date=${board.date_key}`}><Clay object={g?.clay ?? 'cl-23'} /><span>{g?.title}<small className="block t-meta text-mute">{new Date(`${board.date_key}T12:00:00Z`).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</small></span><span className="t-meta">Play</span></Link>;})}</div> : <p className="t-body mt-8">Today&apos;s boards join the archive after midnight. Until then, there is plenty to practice.</p>}<Link href="/practice" className="btn btn-ink t-cta mt-6">Play practice</Link>{!slug ? <section><h2 className="t-h2">Browse by game</h2>{TABLE_GAMES.slice(0,6).map((g)=><Link className="table-link mr-6" key={g.slug} href={`/games/${g.slug}/archive`}>{g.title}</Link>)}</section> : null}</div><SiteFoot /></>;
}
