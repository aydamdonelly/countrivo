import Link from 'next/link';
import { anonymousLeaderboard } from '@/server/anonymous-runs';
import { gamePresentation } from '@/content/table';
import { Clay } from '@/ui/clay';

export async function DailyTable({ slug, dateKey }: { slug: string; dateKey: string }) {
  const [rows, game] = await Promise.all([anonymousLeaderboard(slug, dateKey, 10), Promise.resolve(gamePresentation(slug))]);
  return <div className="daily-table">
    <div className="par-row"><span>Par</span><b className="t-num">{game?.par}</b></div>
    {rows.map((row) => <Link key={row.runId} href={`/games/${slug}/run/${row.runId}`} className="table-board-row"><span className="t-num">{row.rankDaily}</span><Clay object="cl-27" /><span>{row.displayName}</span><b className="t-num">{row.scoreDisplay}</b></Link>)}
    {!rows.length ? <p className="t-body table-board-note">Finish the board and put your name next to Par.</p> : null}
  </div>;
}
