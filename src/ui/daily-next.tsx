import Link from 'next/link';
import { gamePresentation } from '@/content/table';
import { Clay } from './clay';
import { Countdown } from './countdown';
import { Button } from './button';
import { ChevronRightIcon } from './icons/chevron-right';

interface DailyNextProps {
  next?: {slug: string; title: string};
  resetAt: number;
  serverNow: number;
  clientStartedAt?: number;
}

export function DailyNext({next, resetAt, serverNow, clientStartedAt}: DailyNextProps) {
  const game = next ? gamePresentation(next.slug) : undefined;
  return <div className="daily-result-next">
    {next && game ? <Link className="table-next-row" href={`/games/${next.slug}/play?mode=daily`} aria-label={`Play next: ${next.title}`}><Clay object={game.clay} /><span><small className="t-meta">Next</small>{next.title}</span><ChevronRightIcon size={24} /></Link> : <Button variant="ink" href="/">My day</Button>}
    <div className="daily-tomorrow"><Countdown label="New boards in" resetAt={resetAt} serverNow={serverNow} clientStartedAt={clientStartedAt} /></div>
  </div>;
}
