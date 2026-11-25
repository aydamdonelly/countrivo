import { GamePlayLink } from './game-play-link';
import { gamePresentation } from '@/content/table';
import { Clay } from './clay';
import { Countdown } from './countdown';
import { Button } from './button';
import { ShareButton } from './share-button';
import { ReminderOptIn } from './reminder-optin';
import { AppReviewLink } from './app-review-link';
import { AppReviewPrompt } from './app-review-prompt';
import { ChevronRightIcon } from './icons/chevron-right';
import './daily-next.css';

interface DailyNextProps {
  next?: {slug: string; title: string};
  /** Finished dailies today, counting the one just played. */
  done: number;
  total: number;
  /** Present once every daily is finished: the day's share text. */
  dayShare?: string;
  /** Today's board date, for the iOS rating prompt's day count. */
  dateKey: string;
  resetAt: number;
  serverNow: number;
  clientStartedAt?: number;
}

/**
 * Sits directly under a daily's score: how much of today's set is done, then the
 * next unplayed daily as the main action, or, after the last one, sharing the day.
 */
export function DailyNext({next, done, total, dayShare, dateKey, resetAt, serverNow, clientStartedAt}: DailyNextProps) {
  const game = next ? gamePresentation(next.slug) : undefined;
  return <div className="daily-result-next">
    <p className="daily-count t-meta"><span className="daily-dots" aria-hidden="true">{Array.from({length: total}, (_, index) => <i key={index} className={index < done ? 'done' : undefined} />)}</span>{done} of {total} done today</p>
    {next && game ? <GamePlayLink slug={next.slug} className="table-next-row next-game-link" href={`/games/${next.slug}/play?mode=daily`} prefetch warmOnRender ariaLabel={`Play next: ${next.title}`} pendingLabel="Opening your next game…"><Clay object={game.clay} /><span><small className="t-meta">Play next</small>{next.title}</span><ChevronRightIcon size={24} /></GamePlayLink>
      : dayShare ? <div className="day-complete"><p className="t-h3">Your day is complete</p><ShareButton variant="ink" label="Share your day" text={dayShare} source="result" className="btn-block" /><Button variant="text" href="/">My day</Button><AppReviewLink /></div>
      : <Button variant="ink" href="/">My day</Button>}
    <div className="daily-tomorrow"><Countdown label="New boards in" resetAt={resetAt} serverNow={serverNow} clientStartedAt={clientStartedAt} /></div>
    <ReminderOptIn />
    <AppReviewPrompt dateKey={dateKey} done={done} />
  </div>;
}
