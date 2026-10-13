import Link from "next/link";
import Image from "next/image";
import { CABINET_JOBS, type GamePresentation } from "@/content/table";
import { Clay } from "@/ui/clay";
import { cn } from "@/lib/utils";

export interface GameCardProps {
  game: GamePresentation;
  practice?: boolean;
  score?: string;
  progress?: string;
  heading?: "h1" | "h2";
  active?: boolean;
  className?: string;
}

export function GameCard({ game, practice, score, progress, heading = "h2", active = true, className }: GameCardProps) {
  const Heading = heading;
  const href = `/games/${game.slug}/play?mode=${practice ? "practice" : "daily"}`;
  const state = game.clay === "cl-08" ? "full" : score ? game.done : "rest";
  return (
    <article className={cn("game-tray", practice && "game-tray-practice", className)} data-active={active}>
      <span className="tray-surface" aria-hidden="true" />
      <Clay object={game.clay} state={state} alternate={active && !score && !progress ? game.idle : undefined} className="tray-clay" />
      <div className="tray-content">
        <Heading className="t-card tray-title"><Link href={href} className="tray-link">{game.title}</Link></Heading>
        <div className="tray-body">
          {score ? <><p className="t-score-l">{score}</p><p className="t-body">Today&apos;s board, finished.</p></> : <p className="tray-promise">{game.promise}</p>}
          {progress ? <p className="t-body">Your board is saved. Pick up where you left off.</p> : !score ? <div className="tray-steps">{game.steps.map((step) => <p key={step}>{step}</p>)}</div> : null}
        </div>
        <div className="tray-meta t-meta"><span>{progress ?? game.minutes}</span><span>Par {game.par}</span></div>
      </div>
      <GamePreview slug={game.slug} rounds={game.rounds} />
      {practice ? <Clay object="cl-26" className="tray-stamp" /> : null}
      <Link href={href} className="btn btn-ink t-cta tray-play">{score ? "See result" : progress ? "Continue" : practice ? "Play practice" : "Play"}</Link>
    </article>
  );
}

function GamePreview({ slug, rounds }: { slug: string; rounds: number }) {
  if (slug === "country-draft") return <div className="tray-preview cabinet-preview" aria-hidden="true">{CABINET_JOBS.map((job) => <div key={job.slug}><Clay object={job.clay} /><span><b>{job.name}</b><small>{job.description}</small></span></div>)}</div>;
  if (slug === "higher-or-lower") return <div className="tray-preview pair-preview" aria-hidden="true"><span className="t-score-l">?</span><span className="t-score-l">?</span></div>;
  if (slug === "stat-guesser") return <div className="tray-preview ruler-preview" aria-hidden="true"><div>{Array.from({length: 11}, (_, i) => <i key={i} />)}</div><span className="t-meta">Your guess</span></div>;
  if (slug === "pinpoint" || slug === "geo-wordle") return <div className="tray-preview map-preview" aria-hidden="true"><Image src="/design/map-empty.svg" width={222} height={97} alt="" unoptimized /><div className="preview-pips">{Array.from({length: rounds}, (_, i) => <i key={i} />)}</div></div>;
  return <div className="tray-preview flag-preview" aria-hidden="true"><span className="flag-box-empty" /><div className="preview-pips">{Array.from({length: 4}, (_, i) => <i key={i} />)}</div></div>;
}
