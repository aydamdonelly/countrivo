"use client";
import { DailyNext } from '@/ui/daily-next';

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { commitQuickSession, startQuickPractice } from "@/app/actions/quick-session";
import type { QuickAction, QuickView } from "@/games/quick-views";
import type { HostProps } from "@/games/types";
import type { ServerGameRun } from "@/types/server";
import { trackPlay } from "@/lib/play-events";
import { Button } from "@/ui/button";
import { Progress } from "@/ui/progress";
import { ResultPanel } from "@/ui/result-panel";
import { ShareButton } from "@/ui/share-button";
import { CheckIcon } from "@/ui/icons/check";
import { CrossIcon } from "@/ui/icons/cross";
import { ChevronLeftIcon } from "@/ui/icons/chevron-left";
import { LeaderboardEntryForm } from "./leaderboard-entry";
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
  const [view, setView] = useState(p.initialView);
  const [token, setToken] = useState(p.initialToken);
  const [revision, setRevision] = useState(p.sessionRevision ?? 0);
  const [run, setRun] = useState<ServerGameRun | null>(p.savedRun ?? null);
  const [name, setName] = useState(p.publishedName ?? null);
  const [busy, setBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState<QuickAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [animate, setAnimate] = useState(false);
  const busyRef = useRef(false);
  const mountedAt = useRef(0);
  const started = useRef(false);
  useEffect(() => { mountedAt.current = Date.now(); }, []);

  const send = useCallback(async (action: QuickAction) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setPendingAction(action); setError(null);
    if (!started.current) { started.current = true; trackPlay("play_start", view.kind, p.mode); }
    try {
      const response = await commitQuickSession({ sessionToken: token, revision, action });
      setView(response.view); setToken(response.sessionToken); setRevision(response.revision);
      if (response.success) setAnimate(true);
      if (response.run) setRun(response.run);
      setName(response.publishedName ?? null);
      if (!response.success) setError(response.error ?? "Your move could not be saved. Try again.");
      else if (response.view.phase === "finished") {
        trackPlay("play_finish", view.kind, p.mode);
        if (p.mode === "daily") {
          const maxAge = secondsUntilReset(p.resetAt, p.serverNow, mountedAt.current || Date.now());
          writeDone(p.dateKey, p.edition, view.kind, response.view.score, maxAge);
          writeLockoutBelt(view.kind, p.dateKey, p.edition, response.run?.scoreRaw ?? 0, response.view.score);
          clearProgress(view.kind);
        }
      }
    } catch { setError("Your move was not confirmed. Check your connection and try again."); }
    finally { busyRef.current = false; setBusy(false); setPendingAction(null); }
  }, [token, revision, p.mode, p.dateKey, p.edition, p.resetAt, p.serverNow, view.kind]);

  async function practice() {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(null);
    try { const response = await startQuickPractice(view.kind); setView(response.view); setToken(response.sessionToken); setRevision(response.revision); setRun(response.run ?? null); setName(null); setAnimate(false); started.current = false; }
    catch { setError("The next board could not be opened. Try again."); }
    finally { busyRef.current = false; setBusy(false); }
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (busy || event.repeat || event.metaKey || event.ctrlKey || event.altKey || view.phase === "finished") return;
      if (event.target instanceof HTMLElement && (event.target.isContentEditable || event.target.closest("input,textarea,select,[role=slider]"))) return;
      let action: QuickAction | null = null;
      if (view.phase === "reveal" && ["Enter", "n", "N"].includes(event.key)) action = { t: "next" };
      else if (view.phase === "playing" && view.kind === "higher-or-lower") {
        if (["h", "H", "ArrowUp"].includes(event.key)) action = { t: "guess", c: "higher" };
        else if (["l", "L", "ArrowDown"].includes(event.key)) action = { t: "guess", c: "lower" };
      } else if (view.phase === "playing" && view.kind === "flag-quiz") {
        const i = Number(event.key) - 1;
        if (Number.isInteger(i) && i >= 0 && i < view.options.length) action = { t: "answer", i };
      }
      if (action) { event.preventDefault(); void send(action); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, busy, send]);

  const next = p.dailies.find((daily) => daily.slug !== view.kind && !p.shotToday.includes(daily.slug));
  return <div className="quick-remote" aria-busy={busy}>
    <header className="qr-header"><Link href={`/games/${view.kind}`} aria-label={`Back to ${p.title}`}><ChevronLeftIcon size={24} /></Link>
      {/* eslint-disable-next-line @next/next/no-img-element -- local clay frame changes only after commit */}
      <img src={clayFor(view)} width={40} height={40} alt="" className={animate && view.phase !== "playing" ? "qr-clay-reveal" : undefined} /><h1 className="t-h3">{p.title}</h1><small className="t-meta">{p.mode === "daily" ? "Daily" : "Practice"}</small>
    </header>
    {view.phase === "finished" ? <>
      <ResultPanel mode={p.mode} game={p.title} score={view.score} animateScore={animate} practiceHref={`/games/${view.kind}/play?mode=practice`} actions={<><Button variant="ink" onClick={p.mode === "practice" ? () => void practice() : undefined} href={p.mode === "daily" ? `/games/${view.kind}/leaderboard` : undefined} disabled={busy}>{p.mode === "daily" ? "Today's board" : "One more"}</Button><ShareButton text={view.shareText} onShare={() => trackPlay("share", view.kind, p.mode)} /></>}>
        {run && p.mode === "daily" ? <LeaderboardEntryForm run={run} publishedName={name} onPublished={setRun} /> : null}
        <details className="qr-history"><summary className="t-body">How it went</summary>{view.history.map((row, index) => <div className="qr-history-row" key={`${index}-${row.label}`}><span>{row.correct ? <CheckIcon size={18} /> : <CrossIcon size={18} />}</span><span><b className="t-body">{row.label}</b><small className="t-meta">Your guess: {row.guess}. Answer: {row.answer}.</small></span><b className="t-score num">+{row.points}</b></div>)}</details>
      </ResultPanel>
      {p.mode === "daily" ? <DailyNext next={next} resetAt={p.resetAt} serverNow={clockOrigin.serverNow} clientStartedAt={clockOrigin.clientNow} /> : null}
    </> : <><Progress {...view.progress} />{view.kind === "higher-or-lower" ? <HigherBoard view={view} busy={busy} pendingChoice={pendingAction?.t === "guess" ? pendingAction.c : null} send={send} /> : view.kind === "flag-quiz" ? <FlagBoard view={view} busy={busy} pendingChoice={pendingAction?.t === "answer" ? pendingAction.i : null} send={send} /> : <StatBoard key={view.round} view={view} busy={busy} send={send} animate={animate} />}</>}
    <span className="sr-only" role="status">{busy ? pendingAction?.t === "next" ? "Opening the next round." : "Choice selected. Waiting for confirmation." : ""}</span>
    {error ? <p className="t-body text-ember qr-error" role="alert">{error}</p> : null}
  </div>;
}
