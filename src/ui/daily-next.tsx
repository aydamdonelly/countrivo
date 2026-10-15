import { GamePlayLink } from './game-play-link';
import { gamePresentation } from '@/content/table';
import { Clay } from './clay';
import { Countdown } from './countdown';
import { Button } from './button';
import { ChevronRightIcon } from './icons/chevron-right';
import './daily-next.css';

interface DailyNextProps {
  next?: {slug: string; title: string};
  resetAt: number;
  serverNow: number;
  clientStartedAt?: number;
}

export function DailyNext({next, resetAt, serverNow, clientStartedAt}: DailyNextProps) {
  const game = next ? gamePresentation(next.slug) : undefined;
  return <div className="daily-result-next">
    {next && game ? <GamePlayLink slug={next.slug} className="table-next-row next-game-link" href={`/games/${next.slug}/play?mode=daily`} prefetch warmOnRender ariaLabel={`Play next: ${next.title}`} preserveContent pendingLabel="Opening…"><Clay object={game.clay} /><span><small className="t-meta">Play next</small>{next.title}</span><ChevronRightIcon size={24} /></GamePlayLink> : <Button variant="ink" href="/">My day</Button>}
    <div className="daily-tomorrow"><Countdown label="New boards in" resetAt={resetAt} serverNow={serverNow} clientStartedAt={clientStartedAt} /></div>
  </div>;
}
