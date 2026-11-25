"use client";
import { dailyProgress } from '@/features/play/daily-progress';
import { ChallengeResult } from "@/ui/challenge-result";
import { DailyHabit } from '@/ui/daily-habit';

import { NavigationLink as Link } from "@/ui/navigation-link";
import { useCallback, useEffect, useRef, useState } from "react";
import { commitQuickSession, startQuickPractice } from "@/app/actions/quick-session";
import { isFlagSprint, type QuickAction, type QuickView } from "@/games/quick-views";
import type { HostProps } from "@/games/types";
import type { ServerGameRun } from "@/types/server";
import { trackCompletedRun, trackPlay } from "@/lib/play-events";
import { clayFlagSrc } from "@/lib/flag-assets";
import { Button } from "@/ui/button";
import { Progress } from "@/ui/progress";
import { GameHelp } from "@/ui/game-help";
import { ResultPanel, runRank } from "@/ui/result-panel";
import { CheckIcon } from "@/ui/icons/check";
import { CrossIcon } from "@/ui/icons/cross";
import { ChevronRightIcon } from "@/ui/icons/chevron-right";
import { MinusIcon } from "@/ui/icons/minus";
import { ChevronLeftIcon } from "@/ui/icons/chevron-left";
import { ResultFollowup, ResultFeedback } from "./result-followup";
import { SessionNotice } from "./session-notice";
import { clearProgress, secondsUntilReset, writeDone, writeLockoutBelt } from "./persist";
import "./quick-remote.css";
import { Board as HigherBoard } from "@/games/higher-or-lower/board";
import { Board as FlagBoard } from "@/games/flag-quiz/legacy-board";
import { Board as FlagSprintBoard } from "@/games/flag-quiz/board";
import { Result as FlagSprintResult } from "@/games/flag-quiz/result";
import { Board as StatBoard } from "@/games/stat-guesser/board";

function clayFor(view: QuickView): string {
  if (view.kind === "higher-or-lower") return `/clay/cl-04/${view.phase === "playing" ? "rest" : view.correct ? "level" : "lean"}.128.webp`;
  if (isFlagSprint(view)) return `/clay/cl-05/${view.stage !== "finished" ? "rest" : view.correct >= view.target ? "rosette" : "droop"}.128.webp`;
  if (view.kind === "flag-quiz") return `/clay/cl-05/${view.phase === "playing" ? "rest" : view.phase === "finished" || view.picked === view.correctIndex ? "rosette" : "droop"}.128.webp`;
  return `/clay/cl-06/${view.phase === "playing" ? "rest" : "slide"}.128.webp`;
}

/** The card's verdict from the recap rows: `7 of 10 calls right`, `1 close, 1 near, 3 far`. */
function quickOutcome(view: QuickView): string | undefined {
  if (isFlagSprint(view) || !view.history.length) return undefined;
  if (view.kind === "higher-or-lower" && view.mode === "practice") return undefined;
  const right = view.history.filter((row) => row.correct).length;
  if (view.kind === "stat-guesser") {
    const tones = { right: 0, near: 0, wrong: 0 };
    for (const row of view.history) tones[row.tone ?? (row.correct ? "right" : "wrong")] += 1;
    return [tones.right ? `${tones.right} close` : "", tones.near ? `${tones.near} near` : "", tones.wrong ? `${tones.wrong} far` : ""].filter(Boolean).join(", ");
  }
  return `${right} of ${view.history.length} ${view.kind === "higher-or-lower" ? "calls" : "flags"} right`;
}

function toneOf(row: QuickView["history"][number]): "right" | "near" | "wrong" {
  return row.tone ?? (row.correct ? "right" : "wrong");
}

/** Every round's answer, open under the score: what you said, what it was, and the points. */
function QuickAnswers({ view }: { view: QuickView }) {
  if (isFlagSprint(view)) return <FlagSprintResult view={view} />;
  if (!view.history.length) return null;
  const right = view.history.filter((row) => row.correct).length;
  return <details className="qr-history" open>
    <summary>Answers<span className="disclosure-count">{view.kind === "stat-guesser" ? `${view.history.length} numbers` : `${right} of ${view.history.length} right`}</span></summary>
    {view.history.map((row, index) => {
      const tone = toneOf(row);
      return <div className="qr-history-row" data-tone={tone} key={`${index}-${row.label}`}>
        <span className="qr-history-mark">{tone === "right" ? <CheckIcon size={18} title={view.kind === "stat-guesser" ? "Close" : "Right"} /> : tone === "near" ? <MinusIcon size={18} title="Near" /> : <CrossIcon size={18} title={view.kind === "stat-guesser" ? "Far" : "Wrong"} />}</span>
        <span><b className="t-body">{row.label}{row.doubled ? <span className="qr-history-double t-meta" aria-label="counted double">×2</span> : null}</b>{row.note ? <small className="t-meta">{row.note}</small> : <small className="t-meta"><span className="sr-only">Your guess: </span>{row.guess}<ChevronRightIcon size={14} /><span className="sr-only">. Answer: </span>{row.answer}</small>}</span>
        <b className="t-score num">+{row.points}</b>
      </div>;
    })}
  </details>;
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
    if (view.phase !== "reveal" || next?.kind !== "flag-quiz" || isFlagSprint(next)) return;
    const image = new Image();
    image.src = clayFlagSrc(next.flagSrc);
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

  const stage = preview ?? view;
  const sprint = isFlagSprint(view);
  return <div className="quick-remote">
    <header className="qr-header"><Link href={p.mode === "daily" ? "/" : "/practice"} prefetch pendingLabel="Opening your games…" aria-label="Back to games"><ChevronLeftIcon size={24} /></Link>
      {/* eslint-disable-next-line @next/next/no-img-element -- local clay frame changes only after commit */}
      <img src={clayFor(stage)} width={40} height={40} alt="" className={animate && stage.phase !== "playing" ? "qr-clay-reveal" : undefined} /><h1 className="t-h3">{p.displayTitle ?? p.title}</h1><small className="t-meta">{p.mode === "daily" ? "Daily" : "Practice"}</small><GameHelp slug={view.kind} title={p.title} />
    </header>
    <ChallengeResult challenge={challenge} run={run} />
    {view.phase === "finished" ? <div ref={resultRef} className="qr-result" tabIndex={-1} role="region" aria-label={`${p.title} result`}>
      <ResultPanel feedback={<ResultFeedback slug={view.kind}/>} slug={view.kind} dateKey={p.mode === "daily" ? p.dateKey : undefined}
        daily={p.mode === "daily" ? { ...dailyProgress(p, view.kind, run?.scoreDisplay ?? view.score), resetAt: p.resetAt, serverNow: clockOrigin.serverNow, clientStartedAt: clockOrigin.clientNow } : undefined}
        mode={p.mode} game={p.title} score={view.score} outcome={quickOutcome(view)} rank={runRank(run)}
        review={<QuickAnswers view={view} />}
        primaryAction={<ResultFollowup slug={view.kind} mode={p.mode} score={view.score} run={run} publishedName={name} onPublished={setRun} />}
        animateScore={animate} practiceHref={`/games/${view.kind}/play?mode=practice`}
        share={{ text: view.shareText, challengeUrl: run?.challengeUrl, onShare: () => trackPlay("share", view.kind, p.mode) }}
        actions={p.mode === "practice" ? <Button onClick={() => void practice()} disabled={busy} pending={busy} pendingLabel="Opening" block>One more</Button> : undefined}>
        {p.mode === "daily" ? <details className="result-week"><summary>Your week</summary><DailyHabit dateKey={p.dateKey} activity={p.activity} reminder={false} /></details> : null}
      </ResultPanel>
    </div> : isFlagSprint(stage) ? <FlagSprintBoard view={stage} busy={busy} pendingChoice={pendingAction?.t === "answer" ? pendingAction.i : null} send={send} /> : <><Progress {...stage.progress} />{stage.kind === "higher-or-lower" ? <HigherBoard view={stage} busy={busy} pendingChoice={pendingAction?.t === "guess" ? pendingAction.c : null} send={send} /> : stage.kind === "flag-quiz" ? <FlagBoard view={stage} busy={busy} pendingChoice={pendingAction?.t === "answer" ? pendingAction.i : null} send={send} /> : <StatBoard key={stage.round} view={stage} busy={busy && !preview} commitBusy={busy} send={send} animate={animate} />}</>}
    <SessionNotice busy={busy} error={error} pendingLabel={pendingAction?.t === "start" ? "Starting the clock…" : pendingAction?.t === "finish" ? "Opening your result…" : sprint ? "" : pendingAction?.t === "next" ? view.round + 1 >= view.total ? "Opening your result…" : "Opening the next round…" : "Confirming your choice…"} onRetry={failedAction ? () => void send(failedAction) : undefined} />
  </div>;
}
