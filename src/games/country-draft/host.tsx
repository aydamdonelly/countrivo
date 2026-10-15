"use client";

import { DailyNext } from '@/ui/daily-next';
import { ChallengeResult } from "@/ui/challenge-result";
import { DailyHabit } from '@/ui/daily-habit';
import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { commitDraftSession, startDraftPractice } from "@/app/actions/draft-session";
import { LeaderboardEntryForm } from "@/features/play/leaderboard-entry";
import { SessionNotice } from "@/features/play/session-notice";
import { clearProgress, secondsUntilReset, writeDone, writeLockoutBelt } from "@/features/play/persist";
import { trackCompletedRun, trackPlay } from "@/lib/play-events";
import { buildCountryDraftShareText } from "@/lib/share";
import { cn } from "@/lib/utils";
import { Flag } from "@/ui/flag";
import { ChevronLeftIcon } from "@/ui/icons/chevron-left";
import { UserIcon } from "@/ui/icons/user";
import { BONUSES, MAX_SCORE, SEAT_WANTS, bandOf } from "@/lib/game-logic/country-draft/tables";
import { poolIndex, seatIndex } from "@/lib/game-logic/country-draft/types";
import type { DraftView } from "@/lib/game-logic/country-draft/public-view";
import type { PoolIdx, SeatIdx } from "@/lib/game-logic/country-draft/types";
import type { HostProps } from "@/games/types";
import type { DraftCommitAction } from "./module";
import type { ServerGameRun } from "@/types/server";
import { Board, ClayJob, JOB_NAMES, type DraftSelection } from "./board";
import "./draft.css";

const Result = dynamic(() => import("./result").then(module => module.Result));
const DraftResultDetails = dynamic(() => import("./result").then(module => module.DraftResultDetails));

const EMPTY_SELECTION: DraftSelection = { country: null, person: null, seat: null, detail: null, revealSeat: null };

export function CountryDraftHost(p: HostProps) {
  if (!p.draftView || !p.sessionToken) return <p className="t-body">This draft could not be opened. <Link href="/games/country-draft/play">Try again</Link></p>;
  return <DraftSession {...p} initialView={p.draftView} initialToken={p.sessionToken} />;
}

function DraftSession(p: HostProps & { initialView: DraftView; initialToken: string }) {
  const [clockOrigin] = useState(() => ({serverNow:p.serverNow,clientNow:Date.now()}));
  const [challenge, setChallenge] = useState(p.challenge);
  const [state, setState] = useState(p.initialView);
  const [preview, setPreview] = useState<DraftView | null>(null);
  const [selection, setSelection] = useState<DraftSelection>(EMPTY_SELECTION);
  const [token, setToken] = useState(p.initialToken);
  const [revision, setRevision] = useState(p.sessionRevision ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAction, setFailedAction] = useState<DraftCommitAction | null>(null);
  const [pendingAction, setPendingAction] = useState<DraftCommitAction | null>(null);
  const [animate, setAnimate] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [run, setRun] = useState<ServerGameRun | null>(p.savedRun ?? null);
  const [publishedName, setPublishedName] = useState<string | null>(p.publishedName ?? null);
  const busyRef = useRef(false);
  const mountedAt = useRef(0);
  const moved = useRef(false);
  const onDrop = useCallback(() => setSelection((s) => ({ ...s, person: null, seat: null })), []);
  const onDetail = useCallback((detail: PoolIdx | null) => setSelection((s) => ({ ...s, detail })), []);
  const onCountry = useCallback((country: PoolIdx) => setSelection((s) => ({ ...s, country })), []);
  const onSeat = useCallback((seat: SeatIdx) => setSelection((s) => ({ ...s, seat })), []);
  const onReveal = useCallback((revealSeat: SeatIdx) => setSelection((s) => ({ ...s, revealSeat })), []);
  const finishReveal = useCallback(() => setReveal(false), []);
  const onPerson = useCallback((person: PoolIdx) => {
    const open = state.seats.map((pick, index) => pick === null ? seatIndex(index) : null).filter((index): index is SeatIdx => index !== null);
    setSelection((s) => ({ ...s, person, detail: null, seat: open.length === 1 ? open[0] : null }));
  }, [state.seats]);

  useEffect(() => { mountedAt.current = Date.now(); }, []);
  useEffect(() => {
    if (state.seats.filter(seat => seat !== null).length >= 4) void import("./result").catch(() => {});
  }, [state.seats]);

  const commit = useCallback(async (action: DraftCommitAction) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setPendingAction(action);
    setFailedAction(null);
    setError(null);
    if (action.t === "next" && state.phase === "seated" && state.nextView?.phase === "country") {
      setSelection(EMPTY_SELECTION);
      setPreview(state.nextView);
    }
    if (!moved.current) { moved.current = true; trackPlay("play_start", "country-draft", p.mode); }
    try {
      const response = await commitDraftSession({ sessionToken: token, revision, action });
      setState(response.view);
      setToken(response.sessionToken);
      setRevision(response.revision);
      if ("reset" in response && response.reset === true) {
        setSelection(EMPTY_SELECTION); setRun(null); setPublishedName(null); setChallenge(undefined);
        setAnimate(false); setReveal(false); setFailedAction(null); moved.current = false;
        setError("Practice roster updated. A fresh draft is ready.");
        return;
      }
      if (response.success) {
        const samePreview = action.t === "next" && response.view.phase === "country" && response.view.round === state.round + 1;
        if (!samePreview) setSelection(EMPTY_SELECTION);
        setAnimate(action.t === "appoint");
        if (response.run) setRun(response.run);
        setPublishedName(response.publishedName ?? null);
        if (response.view.phase === "done") {
          setReveal(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
          if (response.run) trackCompletedRun("country-draft", p.mode, response.run.id);
          if (p.mode === "daily") {
            const label = `${response.view.score} of ${MAX_SCORE}`;
            writeDone(p.dateKey, p.edition, "country-draft", label, secondsUntilReset(p.resetAt, p.serverNow, mountedAt.current || Date.now()));
            writeLockoutBelt("country-draft", p.dateKey, p.edition, response.view.score, label);
            clearProgress("country-draft");
          }
        }
      } else { setSelection(EMPTY_SELECTION); setError(response.error ?? "Your move could not be saved."); setFailedAction(action); }
    } catch { setSelection(EMPTY_SELECTION); setError("Your move was not confirmed. Check your connection."); setFailedAction(action); }
    finally { busyRef.current = false; setBusy(false); setPendingAction(null); setPreview(null); }
  }, [token, revision, p.mode, p.dateKey, p.edition, p.resetAt, p.serverNow, state]);

  const onOpen = useCallback(() => { if (selection.country !== null) void commit({ t: "open", c: selection.country }); }, [selection.country, commit]);
  const onOpenCountry = useCallback((country: PoolIdx) => { setSelection(s => ({ ...s, country })); void commit({ t: "open", c: country }); }, [commit]);
  const onCommit = useCallback((seat: SeatIdx | null = selection.seat) => { if (selection.person !== null && seat !== null) { setSelection(s => ({ ...s, seat })); void commit({ t: "appoint", i: selection.person, s: seat }); } }, [selection.person, selection.seat, commit]);
  const onNext = useCallback(() => { void commit({ t: "next" }); }, [commit]);
  const stage = preview ?? state;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((busy && !preview) || selection.detail !== null || stage.phase === "done" || document.querySelector(".dr-help-details[open]")) return;
      if (event.target instanceof HTMLElement && (event.target.isContentEditable || event.target.closest("input,textarea,select"))) return;
      if (event.key === "Enter" && event.target instanceof HTMLElement && event.target.closest("button,a,summary")) return;
      const digit = Number(event.key) - 1;
      let action: (() => void) | null = null;
      if (stage.phase === "country") {
        const i = poolIndex(digit);
        if (i !== null) action = () => onCountry(i);
        else if (event.key === "Enter") action = onOpen;
      } else if (stage.phase === "people") {
        if (selection.person === null) { const i = poolIndex(digit); if (i !== null) action = () => onPerson(i); }
        else { const seat = seatIndex(digit); if (seat !== null && state.seats[seat] === null) action = () => onSeat(seat); else if (event.key === "Enter") action = onCommit; else if (event.key === "Escape") action = onDrop; }
      } else if (stage.phase === "seated" && ["Enter", "n", "N"].includes(event.key)) action = onNext;
      if (action) { event.preventDefault(); action(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, preview, selection.detail, selection.person, stage, state.seats, onCountry, onOpen, onPerson, onSeat, onCommit, onDrop, onNext]);

  async function newPractice() {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(null); setFailedAction(null);
    try {
      const response = await startDraftPractice();
      setState(response.view); setToken(response.sessionToken); setRevision(response.revision); setRun(response.run ?? null); setPublishedName(null); setChallenge(undefined); setSelection(EMPTY_SELECTION); setAnimate(false); setReveal(false); moved.current = false;
    } catch { setError("The next board could not be opened. Try again."); }
    finally { busyRef.current = false; setBusy(false); }
  }

  const nextGame = p.dailies.find((game) => game.slug !== "country-draft" && !p.shotToday.includes(game.slug));
  const filled = state.seats.filter((seat) => seat !== null).length;
  const shareText = buildCountryDraftShareText({ score: state.score, band: bandOf(state.score).word, fits: state.seats.flatMap((seat) => seat ? [seat.fit] : []), rank: run?.rankDaily ?? null, practice: p.mode === "practice" }, p.dateKey);
  return <div className="dr-game" aria-busy={busy}>
    <header className="dr-play-header"><Link href={p.mode === "daily" ? "/" : "/practice"} aria-label="Back to games" className="dr-back"><ChevronLeftIcon size={24} /></Link>
      <span className={cn("dr-header-clay", state.phase === "done" && "finished")} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size clay object */}
        <img src={`/clay/cl-01/${state.phase === 'done' ? 'coins' : 'rest'}.128.webp`} width={32} height={32} alt="" />
      </span>
      <h1 className="t-h3">Country Draft</h1><span className="dr-pips" aria-label={`${filled} of 5 seats filled`}>{[0, 1, 2, 3, 4].map((index) => <i key={index} className={index < filled ? "filled" : undefined} />)}</span>
      <b className="dr-header-score t-score"><span className="num">{state.score}</span> <small>/ 195</small></b>
      <details className="dr-help-details"><summary className="dr-help" aria-label="How to play Country Draft"><span>?</span></summary><div className="dr-help-panel">
        <h2 className="t-h3">How to play</h2>
        <ol className="dr-help-steps t-meta"><li><Flag iso2="fr" size="m" alt="" /><b>Country</b></li><li><UserIcon size={40} /><b>Person</b></li><li><ClayJob seat={0} /><b>Job</b></li></ol>
        <p className="t-body">5 rounds. Each job once.</p>
        <details className="dr-score-details"><summary className="t-meta">Jobs &amp; scoring</summary><div className="dr-rules-jobs">{JOB_NAMES.map((name, index) => <div key={name}><b className="t-body">{name}</b><small className="t-meta">{SEAT_WANTS[index]}</small></div>)}</div><p className="t-body">Up to 25 for job fit + 10 for fame. Points appear after seating.</p>{BONUSES.map(bonus => <p className="t-meta" key={bonus.key}>{bonus.name} +{bonus.points}: {bonus.needs}.</p>)}</details>
        <details className="dr-score-details"><summary className="t-meta">Keyboard</summary><p className="t-meta">1–3: country or person. 1–5: job. Enter: confirm. Esc: put back. N: next round.</p></details>
      </div></details>
    </header>
    {p.mode === "practice" ? <p className="dr-mode-label t-meta">Practice</p> : null}
    <ChallengeResult challenge={challenge} run={run} />
    {state.phase !== "done" ? <Board state={stage} selection={selection} busy={busy && !preview} commitBusy={busy} animate={animate} onCountry={onCountry} onOpenCountry={onOpenCountry} onOpen={onOpen} onPerson={onPerson} onCommit={onCommit} onDrop={onDrop} onNext={onNext} onDetail={onDetail} onReveal={onReveal} /> : <div className="dr-final">
      <Result state={state} shareText={shareText} challengeUrl={run?.challengeUrl} reveal={reveal} onRevealEnd={finishReveal} onReplay={p.mode === "practice" ? () => void newPractice() : undefined} replayBusy={busy} onShare={() => trackPlay("share", "country-draft", p.mode)}>
        {p.mode === "daily" ? <><DailyNext next={nextGame} resetAt={p.resetAt} serverNow={clockOrigin.serverNow} clientStartedAt={clockOrigin.clientNow} /><DailyHabit dateKey={p.dateKey} activity={p.activity} /></> : null}
      </Result>
      {run && p.mode === "daily" ? <LeaderboardEntryForm run={run} publishedName={publishedName} onPublished={setRun} /> : null}
      {!run && p.mode === "daily" ? <p className="t-meta">Your score is saved on this device. Reload to restore the leaderboard option.</p> : null}
      <DraftResultDetails state={state} />
    </div>}
    <SessionNotice busy={busy} error={error} pendingLabel={pendingAction?.t === "next" ? "Opening the next country…" : pendingAction?.t === "open" ? "Opening your country…" : "Confirming your choice…"} onRetry={failedAction ? () => void commit(failedAction) : undefined} />
  </div>;
}
