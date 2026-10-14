import Link from 'next/link';
import type { GamePresentation } from '@/content/table';
import { Clay } from '@/ui/clay';
import { cn } from '@/lib/utils';
import { GamePlayLink } from '@/ui/game-play-link';
import { CheckIcon } from '@/ui/icons/check';
import { PlayIcon } from '@/ui/icons/play';

export interface GameCardProps {
  game: GamePresentation;
  practice?: boolean;
  score?: string;
  progress?: string;
  heading?: 'h1' | 'h2';
  active?: boolean;
  className?: string;
}

export function GameCard({ game, practice, score, progress, heading = 'h2', active = true, className }: GameCardProps) {
  const Heading = heading;
  const href = `/games/${game.slug}/play?mode=${practice ? 'practice' : 'daily'}`;
  const state = game.clay === 'cl-08' ? 'full' : score ? game.done : 'rest';
  return <article className={cn('game-tile', className)} data-game={game.slug}>
    <GamePlayLink slug={game.slug} href={href} prefetch={active} className="game-tile-main" pendingLabel="Opening…" preserveContent ariaLabel={`${score ? 'See result for' : progress ? 'Continue' : 'Play'} ${game.title}${score ? `, ${score}` : ''}`}>
      <Clay object={game.clay} state={state} alternate={active && !score && !progress ? game.idle : undefined} sizes="(min-width: 768px) 128px, 88px" loading={active ? 'eager' : 'lazy'} />
      <Heading className="game-tile-title">{game.title}</Heading>
      {score ? <span className="tile-score"><CheckIcon size={14} /><b>{score}</b></span> : progress ? <span className="tile-score">Continue</span> : <span className="tile-play-mark" aria-hidden="true"><PlayIcon size={18} /></span>}
    </GamePlayLink>
    {!practice ? <nav className="game-tile-actions" aria-label={`${game.title} modes`}>
      <GamePlayLink slug={game.slug} href={`/games/${game.slug}/play?mode=practice`} prefetch={false} ariaLabel={`Practice ${game.title}`}><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 7h3c5 0 7 10 12 10h3m-4-4 4 4-4 4M3 17h3c2 0 4-2 5-4m2-2c2-3 3-4 5-4h3m-4-4 4 4-4 4" /></svg>Practice</GamePlayLink>
      <Link href={`/games/${game.slug}/archive`} prefetch={false} aria-label={`Archive for ${game.title}`}><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 2v6m8-6v6M4 11h16" /></svg>Archive</Link>
    </nav> : null}
  </article>;
}
