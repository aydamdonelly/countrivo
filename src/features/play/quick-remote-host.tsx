"use client";
import { DailyNext } from '@/ui/daily-next';
import { ChallengeResult } from "@/ui/challenge-result";
import { DailyHabit } from '@/ui/daily-habit';

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { commitQuickSession, startQuickPractice } from "@/app/actions/quick-session";
import type { QuickAction, QuickView } from "@/games/quick-views";
import type { HostProps } from "@/games/types";
import type { ServerGameRun } from "@/types/server";
import { trackCompletedRun, trackPlay } from "@/lib/play-events";
import { Button } from "@/ui/button";
import { Progress } from "@/ui/progress";
import { GameHelp } from "@/ui/game-help";
import { ResultPanel } from "@/ui/result-panel";
import { ShareButton } from "@/ui/share-button";
import { CheckIcon } from "@/ui/icons/check";
import { CrossIcon } from "@/ui/icons/cross";
import { ChevronRightIcon } from "@/ui/icons/chevron-right";
import { ChevronLeftIcon } from "@/ui/icons/chevron-left";
import { ResultFollowup, ResultFeedback } from "./result-followup";
import { SessionNotice } from "./session-notice";
import { clearProgress, secondsUntilReset, writeDone, writeLockoutBelt } from "./persist";
import "./quick-remote.css";
import { Board as HigherBoard } from "@/games/higher-or-lower/board";
import { Board as FlagBoard } from "@/games/flag-quiz/board";
import { Board as StatBoard } from "@/games/stat-guesser/board";

function clayFor(view: QuickView): string {
  if (view.kind === "higher-or-lower") return `/clay/cl-04/${view.phase === "playing" ? "rest" : view.correct ? "level" : "lean"}.128.webp`;
  if (view.kind === "flag-quiz") return `/clay/cl-05/${view.phase === "playing" ? "rest" : view.phase === "finished" || view.picked === view.correctIndex ? "rosette" : "droop"}.128.webp`;
  return `/clay/cl-06/${view.phase === "playing" ? "rest" : "slide"}.128.webp`;
}

export function QuickRemoteHost(p: HostProps) {
  if (!p.quickView || !p.sessionToken) return <p className="t-body">This game could not be opened. <Link href={`/games/${p.slug}/play`}>Try again</Link></p>;
  return <RemoteSession {...p} initialView={p.quickView} initialToken={p.sessionToken} />;
}

function RemoteSession(p: HostProps & { initialView: QuickView; initialToken: string }) {
  const [clockOrigin] = useState(() => ({serverNow:p.serverNow,clientNow:Date.now()}));
  const [challenge, setChallenge] = useState(p.challenge);
  const [view, setView] = useState(p.initialView);
  const resultRef = useRef<HTMLDivElement>(null);
  const previousPhase = useRef(p.initialView.phase);
  useEffect(() => {
    const before = previousPhase.current;
    previousPhase.current = view.phase;
    if (before !== "finished" && view.phase === "finished") {
      resultRef.current?.focus({ preventScroll: true });
      resultRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
    }
  }, [view.phase]);
  const [preview, setPreview] = useState<QuickView | null>(null);
  const [token, setToken] = useState(p.initialToken);
  const [revision, setRevision] = useState(p.sessionRevision ?? 0);
  const [run, setRun] = useState<ServerGameRun | null>(p.savedRun ?? null);
  const [name, setName] = useState(p.publishedName ?? null);
  const [busy, setBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState<QuickAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedAction, setFailedAction] = useState<QuickAction | null>(null);
  const [animate, setAnimate] = useState(false);
  const busyRef = useRef(false);
  const mountedAt = useRef(0);
  const started = useRef(false);
  useEffect(() => { mountedAt.current = Date.now(); }, []);
  useEffect(() => {
    const next = view.nextView;
    if (view.phase !== "reveal" || next?.kind !== "flag-quiz") return;
    const image = new Image();
    image.src = next.flagSrc;
  }, [view]);

  const send = useCallback(async (action: QuickAction) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setPendingAction(action); setError(null); setFailedAction(null);
    const next = action.t === "next" && view.phase === "reveal" ? view.nextView : null;
    if (next?.phase === "playing" && next.kind === view.kind && next.mode === view.mode && next.round === view.round + 1) {
      setPreview({ ...next, score: view.score, progress: view.progress });
    }
    if (!started.current) { started.current = true; trackPlay("play_start", view.kind, p.mode); }
    try {
      const response = await commitQuickSession({ sessionToken: token, revision, action });
      setView(response.view); setToken(response.sessionToken); setRevision(response.revision);
      if (response.success) setAnimate(true);
      if (response.run) setRun(response.run);
      setName(response.publishedName ?? null);
      if (!response.success) { setError(response.error ?? "Your move could not be saved."); setFailedAction(action); }
      else if (response.view.phase === "finished") {
        if (response.run) trackCompletedRun(view.kind, p.mode, response.run.id);
        if (p.mode === "daily") {
          const maxAge = secondsUntilReset(p.resetAt, p.serverNow, mountedAt.current || Date.now());
          writeDone(p.dateKey, p.edition, view.kind, response.view.score, maxAge);
          writeLockoutBelt(view.kind, p.dateKey, p.edition, response.run?.scoreRaw ?? 0, response.view.score);
          clearProgress(view.kind);
        }
      }
    } catch { setError("Your move was not confirmed. Check your connection."); setFailedAction(action); }
    finally { busyRef.current = false; setBusy(false); setPendingAction(null); setPreview(null); }
  }, [token, revision, p.mode, p.dateKey, p.edition, p.resetAt, p.serverNow, view]);

  async function practice() {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(null); setFailedAction(null);
    try { const response = await startQuickPractice(view.kind, token); setView(response.view); setToken(response.sessionToken); setRevision(response.revision); setRun(response.run ?? null); setName(null); setChallenge(undefined); setAnimate(false); started.current = false; }
    catch { setError("The next board could not be opened. Try again."); }
    finally { busyRef.current = false; setBusy(false); }
  }

  const next = p.dailies.find((daily) => daily.slug !== view.kind && !p.shotToday.includes(daily.slug));
  const stage = preview ?? view;
  return <div className="quick-remote">
    <header className="qr-header"><Link href={p.mode === "daily" ? "/" : "/practice"} aria-label="Back to games"><ChevronLeftIcon size={24} /></Link>
      {/* eslint-disable-next-line @next/next/no-img-element -- local clay frame changes only after commit */}
      <img src={clayFor(stage)} width={40} height={40} alt="" className={animate && stage.phase !== "playing" ? "qr-clay-reveal" : undefined} /><h1 className="t-h3">{p.displayTitle ?? p.title}</h1><small className="t-meta">{p.mode === "daily" ? "Daily" : "Practice"}</small><GameHelp slug={view.kind} title={p.title} />
    </header>
    <ChallengeResult challenge={challenge} run={run} />
    {view.phase === "finished" ? <div ref={resultRef} className="qr-result" tabIndex={-1} role="region" aria-label={`${p.title} result`}>
      <ResultPanel feedback={<ResultFeedback slug={view.kind}/>} mode={p.mode} game={p.title} outcome={view.kind !== "stat-guesser" && view.history.length > 0 ? `${view.history.filter(row => row.correct).length} of ${view.history.length} correct` : undefined} score={view.score} primaryAction={<ResultFollowup slug={view.kind} mode={p.mode} score={view.score} run={run} publishedName={name} onPublished={setRun} />} animateScore={animate} practiceHref={`/games/${view.kind}/play?mode=practice`} actions={<>{p.mode === "practice" ? <Button variant="ink" onClick={() => void practice()} disabled={busy} pending={busy} pendingLabel="Opening…">One more</Button> : null}<ShareButton text={view.shareText} challengeUrl={run?.challengeUrl} onShare={() => trackPlay("share", view.kind, p.mode)} /></>}>
        {p.mode === "daily" ? <><DailyNext next={next} resetAt={p.resetAt} serverNow={clockOrigin.serverNow} clientStartedAt={clockOrigin.clientNow} /><details className="result-week"><summary className="t-meta">Your week</summary><DailyHabit dateKey={p.dateKey} activity={p.activity} /></details></> : null}
        <details className="qr-history"><summary className="t-body">Answers</summary>{view.history.map((row, index) => <div className="qr-history-row" key={`${index}-${row.label}`}><span>{row.correct ? <CheckIcon size={18} /> : <CrossIcon size={18} />}</span><span><b className="t-body">{row.label}</b><small className="t-meta"><span className="sr-only">Your guess: </span>{row.guess}<ChevronRightIcon size={14} /><span className="sr-only">. Answer: </span>{row.answer}</small></span><b className="t-score num">+{row.points}</b></div>)}</details>
      </ResultPanel>
    </div> : <><Progress {...stage.progress} />{stage.kind === "higher-or-lower" ? <HigherBoard view={stage} busy={busy} pendingChoice={pendingAction?.t === "guess" ? pendingAction.c : null} send={send} /> : stage.kind === "flag-quiz" ? <FlagBoard view={stage} busy={busy} pendingChoice={pendingAction?.t === "answer" ? pendingAction.i : null} send={send} /> : <StatBoard key={stage.round} view={stage} busy={busy && !preview} commitBusy={busy} send={send} animate={animate} />}</>}
    <SessionNotice busy={busy} error={error} pendingLabel={pendingAction?.t === "next" ? view.round + 1 >= view.total ? "Opening your result…" : "Opening the next round…" : "Confirming your choice…"} onRetry={failedAction ? () => void send(failedAction) : undefined} />
  </div>;
}
