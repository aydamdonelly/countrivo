"use client";

import { DailyNext } from '@/ui/daily-next';
import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { commitDraftSession, startDraftPractice } from "@/app/actions/draft-session";
import { LeaderboardEntryForm } from "@/features/play/leaderboard-entry";
import { clearProgress, secondsUntilReset, writeDone, writeLockoutBelt } from "@/features/play/persist";
import { trackPlay } from "@/lib/play-events";
import { buildCountryDraftShareText } from "@/lib/share";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import { CountUp } from "@/ui/count-up";
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
  const [state, setState] = useState(p.initialView);
  const [selection, setSelection] = useState<DraftSelection>(EMPTY_SELECTION);
  const [token, setToken] = useState(p.initialToken);
  const [revision, setRevision] = useState(p.sessionRevision ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animate, setAnimate] = useState(false);
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
    setError(null);
    if (!moved.current) { moved.current = true; trackPlay("play_start", "country-draft", p.mode); }
    try {
      const response = await commitDraftSession({ sessionToken: token, revision, action });
      setState(response.view);
      setToken(response.sessionToken);
      setRevision(response.revision);
      if (response.success) {
        setSelection(EMPTY_SELECTION);
        setAnimate(true);
        if (response.run) setRun(response.run);
        setPublishedName(response.publishedName ?? null);
        if (response.view.phase === "done") {
          trackPlay("play_finish", "country-draft", p.mode);
          if (p.mode === "daily") {
            const label = `${response.view.score} of ${MAX_SCORE}`;
            writeDone(p.dateKey, p.edition, "country-draft", label, secondsUntilReset(p.resetAt, p.serverNow, mountedAt.current || Date.now()));
            writeLockoutBelt("country-draft", p.dateKey, p.edition, response.view.score, label);
            clearProgress("country-draft");
          }
        }
      } else setError(response.error ?? "Your move could not be saved. Try again.");
    } catch { setError("Your move was not confirmed. Check your connection and try again."); }
    finally { busyRef.current = false; setBusy(false); }
  }, [token, revision, p.mode, p.dateKey, p.edition, p.resetAt, p.serverNow]);

  const onOpen = useCallback(() => { if (selection.country !== null) void commit({ t: "open", c: selection.country }); }, [selection.country, commit]);
  const onCommit = useCallback(() => { if (selection.person !== null && selection.seat !== null) void commit({ t: "appoint", i: selection.person, s: selection.seat }); }, [selection.person, selection.seat, commit]);
  const onNext = useCallback(() => { void commit({ t: "next" }); }, [commit]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (busy || selection.detail !== null || state.phase === "done" || document.querySelector(".dr-help-details[open]")) return;
      if (event.target instanceof HTMLElement && (event.target.isContentEditable || event.target.closest("input,textarea,select"))) return;
      if (event.key === "Enter" && event.target instanceof HTMLElement && event.target.closest("button,a,summary")) return;
      const digit = Number(event.key) - 1;
      let action: (() => void) | null = null;
      if (state.phase === "country") {
        const i = poolIndex(digit);
        if (i !== null) action = () => onCountry(i);
        else if (event.key === "Enter") action = onOpen;
      } else if (state.phase === "people") {
        if (selection.person === null) { const i = poolIndex(digit); if (i !== null) action = () => onPerson(i); }
        else { const seat = seatIndex(digit); if (seat !== null && state.seats[seat] === null) action = () => onSeat(seat); else if (event.key === "Enter") action = onCommit; else if (event.key === "Escape") action = onDrop; }
      } else if (state.phase === "seated" && ["Enter", "n", "N"].includes(event.key)) action = onNext;
      if (action) { event.preventDefault(); action(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, selection.detail, selection.person, state, onCountry, onOpen, onPerson, onSeat, onCommit, onDrop, onNext]);

  async function newPractice() {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(null);
    try {
      const response = await startDraftPractice();
      setState(response.view); setToken(response.sessionToken); setRevision(response.revision); setRun(response.run ?? null); setPublishedName(null); setSelection(EMPTY_SELECTION); setAnimate(false); moved.current = false;
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
      <b className="dr-header-score t-score"><CountUp value={state.score} duration={750} animate={animate} /> <small>/ 195</small></b>
      <details className="dr-help-details"><summary className="dr-help" aria-label="How to play Country Draft"><span>?</span></summary><div className="dr-help-panel">
        <h2 className="t-h3">How to play</h2>
        <ol className="dr-help-steps t-meta"><li><Flag iso2="fr" size="m" alt="" /><b>Country</b></li><li><UserIcon size={40} /><b>Person</b></li><li><ClayJob seat={0} /><b>Job</b></li></ol>
        <p className="t-body">5 rounds. Each job once.</p>
        <details className="dr-score-details"><summary className="t-meta">Jobs &amp; scoring</summary><div className="dr-rules-jobs">{JOB_NAMES.map((name, index) => <div key={name}><b className="t-body">{name}</b><small className="t-meta">{SEAT_WANTS[index]}</small></div>)}</div><p className="t-body">Up to 25 for job fit + 10 for fame. Points appear after seating.</p>{BONUSES.map(bonus => <p className="t-meta" key={bonus.key}>{bonus.name} +{bonus.points}: {bonus.needs}.</p>)}</details>
        <details className="dr-score-details"><summary className="t-meta">Keyboard</summary><p className="t-meta">1–3: country or person. 1–5: job. Enter: confirm. Esc: put back. N: next round.</p></details>
      </div></details>
    </header>
    {p.mode === "practice" ? <p className="dr-mode-label t-meta">Practice</p> : null}
    {state.phase !== "done" ? <Board state={state} selection={selection} busy={busy} animate={animate} onCountry={onCountry} onOpen={onOpen} onPerson={onPerson} onSeat={onSeat} onCommit={onCommit} onDrop={onDrop} onNext={onNext} onDetail={onDetail} onReveal={onReveal} /> : <div className="dr-final">
      <Result state={state} shareText={shareText} animate={animate} />
      {run && p.mode === "daily" ? <LeaderboardEntryForm run={run} publishedName={publishedName} onPublished={setRun} /> : null}
      {!run && p.mode === "daily" ? <p className="t-meta">Your score is saved on this device. Reload to restore the leaderboard option.</p> : null}
      {p.mode === "practice" ? <Button block variant="ink" onClick={() => void newPractice()} disabled={busy}>One more draft</Button> : <DailyNext next={nextGame} resetAt={p.resetAt} serverNow={clockOrigin.serverNow} clientStartedAt={clockOrigin.clientNow} />}
      <DraftResultDetails state={state} />
    </div>}
    {error ? <p className="dr-error t-body" role="alert">{error}</p> : null}
  </div>;
}
