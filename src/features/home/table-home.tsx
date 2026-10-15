'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import type { GamePresentation } from '@/content/table';
import { GameCard } from '@/ui/game-card';
import { CheckIcon } from '@/ui/icons/check';
import { ChevronRightIcon } from '@/ui/icons/chevron-right';
import { Countdown } from '@/ui/countdown';
import { ShareButton } from '@/ui/share-button';
import { preloadGameHost } from '@/features/play/preload-game-host';
import { DailyHabit } from '@/ui/daily-habit';
import type { DailyActivity } from '@/lib/daily-activity';

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
}

export function TableHome({games, done, progress, opening, dateKey, resetAt, serverNow, practice, yesterday, atlas, activity}: TableHomeProps) {
  const finished = games.filter(game => Boolean(done[game.slug])).length;
  const fullSet = !practice && finished === games.length;
  const [dayClosed, setDayClosed] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setDayClosed(true), Math.max(0, resetAt - serverNow));
    return () => window.clearTimeout(id);
  }, [resetAt, serverNow]);
  useEffect(() => {
    if (!fullSet) void preloadGameHost(opening).catch(() => undefined);
  }, [opening, fullSet]);
  return <div className="table-home visual-home">
    {dayClosed && !practice ? <div className="rollover"><p>New games</p><Link href="/" className="btn btn-ink t-cta">Play</Link></div> : null}
    <header className="games-heading">
      <h2 className="t-h2">{practice ? 'Practice' : 'Daily games'}</h2>
      {practice ? <Link href="/" className="t-meta">Today’s games <ChevronRightIcon size={16} /></Link> : <Countdown resetAt={resetAt} serverNow={serverNow} label="New boards in" />}
    </header>
    {!practice && finished > 0 ? <div className="day-progress" aria-label={`${finished} of ${games.length} games finished`}><div aria-hidden="true">{games.map(game => <span className={done[game.slug] ? 'finished' : undefined} key={game.slug}>{done[game.slug] ? <CheckIcon size={12} /> : null}</span>)}</div><span className="t-meta">{finished}/{games.length}</span></div> : null}
    <div className="game-index daily-game-grid">
      {games.map(game => <GameCard key={game.slug} game={game} practice={practice} score={done[game.slug]} progress={progress[game.slug]} active={!fullSet && game.slug === opening} />)}
    </div>
    {!practice ? <div className="full-set-actions"><DailyHabit dateKey={dateKey} activity={activity} completed={finished > 0} />{finished > 0 ? <ShareButton text={`Countrivo ${dateKey}\n${games.filter(game => done[game.slug]).map(game => `${game.title}: ${done[game.slug]}`).join('\n')}\nhttps://countrivo.com`} label="Share your day" /> : null}{atlas ? <details><summary>Your world today</summary>{atlas}</details> : null}</div> : null}
    {!practice && yesterday ? <details className="past-answers"><summary>Yesterday’s answers</summary>{yesterday}</details> : null}
  </div>;
}
