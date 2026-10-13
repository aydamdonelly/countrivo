import Link from 'next/link';
import { gamePresentation } from '@/content/table';
import { Clay } from './clay';
import { Countdown } from './countdown';
import { Button } from './button';

interface DailyNextProps {
  next?: {slug: string; title: string};
  resetAt: number;
  serverNow: number;
  clientStartedAt?: number;
}

export function DailyNext({next, resetAt, serverNow, clientStartedAt}: DailyNextProps) {
  const game = next ? gamePresentation(next.slug) : undefined;
  return <div className="daily-result-next">
    {next && game ? <Link className="table-next-row" href={`/games/${next.slug}/play?mode=daily`}><Clay object={game.clay} /><span>Next: {next.title}<small className="t-meta">{game.promise}</small></span><b className="btn btn-ink t-cta">Play</b></Link> : <Button variant="ink" href="/">See my full day</Button>}
    <div className="daily-tomorrow"><Clay object="cl-23" state="open" alternate="peek" /><Countdown label="New boards in" resetAt={resetAt} serverNow={serverNow} clientStartedAt={clientStartedAt} /></div>
  </div>;
}
