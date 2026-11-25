import { GamePlayLink } from './game-play-link';
import { gamePresentation } from '@/content/table';
import { withCompletedDay } from '@/lib/daily-activity';
import type { DailyProgress } from '@/features/play/daily-progress';
import { Clay, gameClayFrame } from './clay';
import { Countdown } from './countdown';
import { Button } from './button';
import { Flame } from './flame';
import { ShareButton } from './share-button';
import { RemindMe } from './reminder-optin';
import { AppReviewLink } from './app-review-link';
import { AppReviewPrompt } from './app-review-prompt';
import { ArrowRightIcon } from './icons/arrow-right';
import { NavigationLink } from './navigation-link';
import { boardDate, numberWord, shortDuration, stripScore } from './result-format';
import './daily-next.css';

export interface DailyNextProps extends DailyProgress {
  resetAt: number;
  serverNow: number;
  clientStartedAt?: number;
  onShareDay?: () => void;
}

/** `Place a country · 2 min` from the game's presentation. */
function nextLine(slug: string): string {
  const game = gamePresentation(slug);
  if (!game) return '';
  return [game.action, shortDuration(game.minutes)].filter(Boolean).join(' · ');
}

function Clock({ resetAt, serverNow, clientStartedAt }: Pick<DailyNextProps, 'resetAt' | 'serverNow' | 'clientStartedAt'>) {
  return <div className="daily-tomorrow"><Countdown label="New boards in" resetAt={resetAt} serverNow={serverNow} clientStartedAt={clientStartedAt} /><RemindMe /></div>;
}

/**
 * The primary block under a daily's score (build contract: directly after the card). Before
 * the last daily: the progress row, the ink next-game card (the view's only primary) and the
 * countdown row. After the last daily: the day-complete card, which owns the only share.
 */
export function DailyNext(props: DailyNextProps) {
  const { next, done, total, dayShare, dateKey, resetAt, serverNow, clientStartedAt } = props;
  const game = next ? gamePresentation(next.slug) : undefined;
  const frame = game ? gameClayFrame(game.clay, game.done) : undefined;
  if (!next && dayShare) return <div className="daily-result-next is-complete"><DayComplete {...props} dayShare={dayShare} /><AppReviewLink /><AppReviewPrompt dateKey={dateKey} done={done} /></div>;
  return <div className="daily-result-next">
    <p className="daily-count"><span className="daily-dots" aria-hidden="true">{Array.from({ length: total }, (_, index) => <i key={index} className={index < done ? 'done' : undefined} />)}</span>{done} of {total} done today</p>
    {next && game ? <GamePlayLink slug={next.slug} className="next-card next-game-link" href={`/games/${next.slug}/play?mode=daily`} prefetch warmOnRender ariaLabel={`Play next: ${next.title}`} pendingLabel="Opening">
      <span className="next-plate" data-game={next.slug}>{frame ? <Clay object={game.clay} state={frame.state} tone={frame.tone} sizes="44px" loading="eager" /> : null}</span>
      <span className="next-copy"><small>Up next</small><b>{next.title}</b><span>{nextLine(next.slug)}</span></span>
      <span className="next-go" aria-hidden="true"><ArrowRightIcon size={20} /></span>
    </GamePlayLink> : <Button href="/">Back to today</Button>}
    <Clock resetAt={resetAt} serverNow={serverNow} clientStartedAt={clientStartedAt} />
    <AppReviewPrompt dateKey={dateKey} done={done} />
  </div>;
}

/** "Day complete": trophy, the day's scores on their plates, one primary share, a quiet way back.
 *  The home shows the same card once every daily is done (`home`: no "Back to today"). */
export function DayComplete({ total, dayShare, dateKey, dailies, scores, activity, resetAt, serverNow, clientStartedAt, onShareDay, home }: DailyNextProps & { dayShare: string; home?: boolean }) {
  const count = numberWord(total);
  const streak = activity ? withCompletedDay(activity, dateKey).current : 0;
  return <section className="day-done" aria-labelledby="day-done-title">
    <span className="day-done-art" aria-hidden="true"><Clay object="cl-20" state="tip" sizes="104px" loading="eager" /><Clay object="cl-20" className="day-done-rest" sizes="104px" loading="eager" /></span>
    <p className="day-done-date">{boardDate(dateKey)}</p>
    <h2 id="day-done-title" className="day-done-title">Day complete</h2>
    {count ? <p className="day-done-sub">All {count} done today</p> : null}
    {streak >= 2 ? <p className="day-done-streak"><Flame size={16} />{streak}-day streak</p> : null}
    <ul className="day-strip" style={{ gridTemplateColumns: `repeat(${dailies.length}, minmax(0, 1fr))` }} aria-label="Today’s scores">
      {dailies.map((daily) => {
        const game = gamePresentation(daily.slug);
        const { value, unit } = stripScore(daily.slug, scores[daily.slug]);
        return <li key={daily.slug}><NavigationLink href={`/games/${daily.slug}/play?mode=daily`} aria-label={`${daily.title}: ${value}${unit ? ` ${unit}` : ''}`} pendingLabel="Opening">
          <span className="strip-plate" data-game={daily.slug}>{game ? <Clay object={game.clay} state={game.done} tone="color" sizes="34px" loading="eager" /> : null}</span>
          <b className="num">{value}</b><small>{unit}</small>
        </NavigationLink></li>;
      })}
    </ul>
    <ShareButton variant="primary" block label="Share your day" text={dayShare} source={home ? 'home' : 'result'} onShare={onShareDay} className="day-done-share" />
    {home ? null : <Button variant="tertiary" href="/" className="day-done-back">Back to today</Button>}
    <footer className="day-done-foot"><Clock resetAt={resetAt} serverNow={serverNow} clientStartedAt={clientStartedAt} /></footer>
  </section>;
}
