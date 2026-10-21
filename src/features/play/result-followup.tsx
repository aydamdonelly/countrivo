import { ChevronRightIcon } from "@/ui/icons/chevron-right";
import { useState } from "react";
import { ReportName } from "@/features/social/report-name";
import type { ServerGameRun } from "@/types/server";
import { isGameSlug } from "@/ui/types";
import { gamePresentation } from "@/content/table";
import { SiteFeedback } from "@/ui/site-feedback";
import { GamePlayLink } from "@/ui/game-play-link";
import { NavigationLink } from "@/ui/navigation-link";
import { LeaderboardEntryForm } from "./leaderboard-entry";
import "./result-followup.css";

interface ResultFollowupProps {
  slug: string;
  mode: string;
  score: string;
  run: ServerGameRun | null;
  publishedName?: string | null;
  onPublished?: (run: ServerGameRun) => void;
}

export function ResultFollowup({ slug, mode, score, run, publishedName, onPublished }: ResultFollowupProps) {
  const [blockedRows, setBlockedRows] = useState<number[]>([]);
  const board = run?.leaderboard;
  const dailySlug = board?.gameSlug ?? (slug === "speed-flags" || slug === "blind-pick" ? "country-draft" : slug);
  const daily = gamePresentation(dailySlug);
  return <div className="result-followup">
    {mode === "daily" ? run ? <LeaderboardEntryForm run={run} publishedName={publishedName} onPublished={onPublished} /> : <p className="t-meta" role="status">Saving your result…</p> : <section className="practice-standing" aria-label="Daily leaderboard after practice">
      <header><h2 className="t-h3">{dailySlug === slug ? "Today’s leaderboard" : `${daily?.title ?? "Daily"} leaderboard`}</h2><span className="t-meta">Daily</span></header>
      {board?.available && board.entries.length ? <ol aria-label="Published daily scores">{board.entries.filter(entry => !blockedRows.includes(entry.runId)).map(entry => <li className="standing-row" key={entry.runId}><span className="standing-rank num">{entry.rank}</span><span className="standing-name">{entry.displayName}</span><b className="standing-score num">{entry.scoreDisplay}</b><ReportName runId={entry.runId} name={entry.displayName} onBlocked={() => setBlockedRows(previous => [...previous, entry.runId])}/></li>)}</ol> : <p className="t-meta text-mute">{board?.available === false ? "The daily leaderboard couldn’t be opened." : "Today’s challenge is ready."}</p>}
      <p className="practice-unranked t-meta">Your practice score: <b>{score}</b> · unranked</p>
      <GamePlayLink slug={dailySlug} href={`/games/${dailySlug}/play?mode=daily`} className="btn btn-ink t-cta" pendingLabel="Opening…">Play today’s {daily?.title ?? "game"} to join</GamePlayLink>
      <NavigationLink href={`/games/${dailySlug}/leaderboard`} className="standing-full t-meta">Full leaderboard<ChevronRightIcon size={16} /></NavigationLink>
    </section>}
  </div>;
}

export function ResultFeedback({ slug }: { slug: string }) {
  return <SiteFeedback gameSlug={isGameSlug(slug) ? slug : undefined} context="result" />;
}
