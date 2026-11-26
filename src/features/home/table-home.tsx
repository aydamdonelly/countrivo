'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { NavigationLink as Link } from '@/ui/navigation-link';
import type { GamePresentation } from '@/content/table';
import { GameCard } from '@/ui/game-card';
import { ChevronRightIcon } from '@/ui/icons/chevron-right';
import { ShuffleIcon } from '@/ui/icons/shuffle';
import { CalendarIcon } from '@/ui/icons/calendar';
import { Countdown } from '@/ui/countdown';
import { ShareButton } from '@/ui/share-button';
import { Flame } from '@/ui/flame';
import { DayComplete } from '@/ui/daily-next';
import { boardDate, numberWord } from '@/ui/result-format';
import { preloadGameHost } from '@/features/play/preload-game-host';
import { SiteFeedback } from '@/ui/site-feedback';
import type { DailyActivity } from '@/lib/daily-activity';
import { buildDayShareText } from '@/lib/share';
import { isGameSlug } from '@/ui/types';
import type { DailyRef } from '@/games/types';

interface TableHomeProps {
  games: readonly GamePresentation[];
  done: Record<string, string>;
  progress: Record<string, string>;
  opening: string;
  dateKey: string;
  resetAt: number;
  serverNow: number;
  practice?: boolean;
  yesterday?: ReactNode;
  atlas?: ReactNode;
  activity?: DailyActivity;
  /** The Product Hunt launch day: one line above the heading. */
  launchUrl?: string;
}

function capitalised(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * The home (25 November 2026 design pass). One heading, one line for a first visit or the streak
 * and today's progress for a returning player, the card to play next with the page's only
 * primary in its own place in the fixed order, the other games as tiles, then Practice and Archive once, quietly, below the grid.
 * After the last daily the lead card becomes the day-complete card with the one "Share your day".
 */
export function TableHome({games, done, progress, opening, dateKey, resetAt, serverNow, practice, yesterday, atlas, activity, launchUrl}: TableHomeProps) {
  const finished = games.filter(game => Boolean(done[game.slug])).length;
  const fullSet = !practice && finished === games.length;
  const returning = !practice && (finished > 0 || Boolean(activity?.played));
  const [dayClosed, setDayClosed] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setDayClosed(true), Math.max(0, resetAt - serverNow));
    return () => window.clearTimeout(id);
  }, [resetAt, serverNow]);
  useEffect(() => {
    if (!fullSet && !practice) void preloadGameHost(opening).catch(() => undefined);
  }, [opening, fullSet, practice]);
  const leadGame = !practice && !fullSet ? games.find(game => game.slug === opening && !done[game.slug]) ?? games.find(game => !done[game.slug]) : undefined;
  const dayShare = finished > 0 ? buildDayShareText(dateKey, games.flatMap(game => done[game.slug] ? [{ title: game.title, score: done[game.slug] }] : [])) : undefined;
  const count = numberWord(games.length);
  const streak = activity?.current ?? 0;
  const dailies: DailyRef[] = games.flatMap(game => isGameSlug(game.slug) ? [{ slug: game.slug, title: game.title }] : []);
  return <div className={practice ? 'table-home visual-home practice-home' : 'table-home visual-home'}>
    {launchUrl && !practice ? <a className="ph-launch" href={launchUrl} target="_blank" rel="noopener"><b>Countrivo is on Product Hunt today.</b><span>Tell us what to fix<ChevronRightIcon size={16} /></span></a> : null}
    {dayClosed && !practice ? <div className="rollover"><p>New games are ready.</p><Link href="/" className="btn btn-secondary">Open today</Link></div> : null}
    <header className="games-heading">
      <h1 className="t-h1">{practice ? 'Unlimited geography games' : 'Daily games'}</h1>
      {practice ? <>
        <p className="home-lead">Free practice boards for every game. Unlimited, no account, no leaderboard.</p>
        <div className="home-meta"><Link href="/" className="home-back">Today’s daily games<ChevronRightIcon size={16} /></Link></div>
      </> : fullSet ? null : returning ? <>
        <div className="home-meta">
          {streak >= 1 ? <p className="home-streak"><Flame size={16} /><b>{streak}-day streak</b>{activity && activity.best > streak ? <span className="home-best"> · best {activity.best}</span> : null}</p> : <p className="home-date">{boardDate(dateKey)}</p>}
          <Countdown resetAt={resetAt} serverNow={serverNow} label="New boards in" />
        </div>
        <div className="home-progress">
          <p className="daily-count" aria-label={`${finished} of ${games.length} daily games done today`}>
            <span className="daily-dots" aria-hidden="true">{games.map(game => <i key={game.slug} className={done[game.slug] ? 'done' : undefined} />)}</span>
            <span className="home-count">{finished} of {games.length} done<span className="home-today"> today</span></span>
          </p>
          {dayShare ? <ShareButton variant="tertiary" label="Share so far" text={dayShare} source="home" /> : null}
        </div>
      </> : <>
        <p className="home-lead">{count ? `${capitalised(count)} short geography games.` : 'Short geography games.'} New every day, free, no account.</p>
        <div className="home-meta"><p className="home-date">{boardDate(dateKey)}</p><Countdown resetAt={resetAt} serverNow={serverNow} label="New boards in" /></div>
      </>}
    </header>
    {fullSet && dayShare ? <div className="home-day-done"><DayComplete home next={undefined} done={finished} total={games.length} dayShare={dayShare} dateKey={dateKey} dailies={dailies} scores={done} activity={activity} resetAt={resetAt} serverNow={serverNow} /></div> : null}
    <div className="game-index daily-game-grid">
      {/* 25 November 2026: the games keep their fixed order; the next game grows in its own place instead of jumping to the front. */}
      {games.map(game => game === leadGame
        ? <GameCard key={game.slug} game={game} progress={progress[game.slug]} lead={returning ? 'next' : 'start'} />
        : <GameCard key={game.slug} game={game} practice={practice} score={done[game.slug]} progress={progress[game.slug]} active={false} isNew={!practice && Boolean(game.newUntil && dateKey <= game.newUntil)} />)}
    </div>
    {practice ? null : <section className="home-more" aria-labelledby="home-more-title">
      <h2 id="home-more-title" className="t-h3">More ways to play</h2>
      <div className="home-more-rows">
        <Link href="/practice" className="home-more-row" prefetch={false}><span className="home-more-icon"><ShuffleIcon size={20} /></span><span><b>Practice</b><small>Unlimited boards for every game</small></span><ChevronRightIcon size={20} className="chev" /></Link>
        <Link href="/archive" className="home-more-row" prefetch={false}><span className="home-more-icon"><CalendarIcon size={20} /></span><span><b>Archive</b><small>Replay any past day</small></span><ChevronRightIcon size={20} className="chev" /></Link>
      </div>
    </section>}
    {!practice && (atlas || yesterday) ? <div className="home-disclosures">
      {atlas ? <details className="disclose"><summary>Your world today</summary>{atlas}</details> : null}
      {yesterday ? <details className="disclose past-answers"><summary>Yesterday’s answers</summary>{yesterday}</details> : null}
    </div> : null}
    {practice ? null : <div className="home-feedback"><SiteFeedback compact /></div>}
  </div>;
}
