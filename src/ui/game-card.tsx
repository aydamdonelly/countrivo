import type { GamePresentation } from '@/content/table';
import { gameLengthLine } from '@/content/table';
import { Clay, gameClayFrame } from '@/ui/clay';
import { cn } from '@/lib/utils';
import { GamePlayLink } from '@/ui/game-play-link';
import { CheckIcon } from '@/ui/icons/check';
import { PlayIcon } from '@/ui/icons/play';
import './game-card.css';

export interface GameCardProps {
  game: GamePresentation;
  practice?: boolean;
  score?: string;
  progress?: string;
  heading?: 'h1' | 'h2' | 'h3';
  /** The card the server opens first: its artwork loads eagerly. */
  active?: boolean;
  /** The home's lead card: chip, promise, length and the page's one primary "Play". */
  lead?: 'start' | 'next';
  /** Marks a recently launched game New until it has been played. */
  isNew?: boolean;
  className?: string;
}

/**
 * A game tile (25 November 2026 design pass). The game's pastel is its identity; the clay shows
 * its colour frame whether or not it has been played, so nothing looks switched off. A finished
 * daily carries a check and its score, a started one "Continue". No per-tile action bars: Practice
 * and Archive live once, below the grid. The `lead` variant is the card to play next, spanning
 * the grid with a full-width ink "Play <Game>". Practice tiles prefetch on intent only (eight
 * viewport prefetches would compete with the one the player chooses).
 */
export function GameCard({ game, practice, score, progress, heading = 'h2', active = true, lead, isNew, className }: GameCardProps) {
  const Heading = heading;
  const href = `/games/${game.slug}/play?mode=${practice ? 'practice' : 'daily'}`;
  const done = !practice && Boolean(score);
  const frame = gameClayFrame(game.clay, game.done);
  const state = done ? 'done' : progress ? 'progress' : 'open';
  const verb = done ? 'See result for' : progress ? 'Continue' : 'Play';
  const label = `${verb} ${game.title}${score ? `, ${score}` : ''}`;
  const badge = done ? <span className="tile-score"><CheckIcon size={14} /><b>{score}</b></span>
    : progress ? <span className="tile-score">Continue</span>
    : isNew ? <span className="tile-score tile-new">New</span> : null;
  if (lead && !done) {
    return <article className={cn('game-tile game-lead', className)} data-game={game.slug} data-state={state}>
      <GamePlayLink slug={game.slug} href={href} prefetch warmOnRender className="game-tile-main" pendingLabel="Opening" ariaLabel={label}>
        <span className="lead-copy">
          <span className="lead-chip">{progress ? 'Continue' : lead === 'start' ? 'Start here' : 'Next'}</span>
          <Heading className="game-tile-title">{game.title}</Heading>
          <span className="lead-promise">{game.promise}</span>
          <span className="lead-length">{gameLengthLine(game)}</span>
        </span>
        <Clay object={game.clay} state={frame.state} tone={frame.tone} alternate={frame.tone === 'original' ? game.idle : undefined} sizes="(min-width: 1024px) 160px, 124px" loading="eager" />
        <span className="btn btn-primary btn-block lead-play"><PlayIcon size={18} />{progress ? 'Continue' : 'Play'} {game.title}</span>
      </GamePlayLink>
    </article>;
  }
  return <article className={cn('game-tile', className)} data-game={game.slug} data-state={state}>
    <GamePlayLink slug={game.slug} href={href} prefetch={!practice} className="game-tile-main" pendingLabel={score ? 'Opening result' : 'Opening'} ariaLabel={label}>
      <Clay object={game.clay} state={frame.state} tone={frame.tone} sizes="(min-width: 1024px) 104px, 84px" loading={active ? 'eager' : 'lazy'} />
      <Heading className="game-tile-title">{game.title}</Heading>
      {game.action ? <span className="game-tile-action">{done ? 'See your result' : game.action}</span> : null}
      {badge}
    </GamePlayLink>
  </article>;
}
