"use client";

import { DailyNext } from '@/ui/daily-next';
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { commitDraftSession, startDraftPractice } from "@/app/actions/draft-session";
import { LeaderboardEntryForm } from "@/features/play/leaderboard-entry";
import { clearProgress, secondsUntilReset, writeDone, writeLockoutBelt } from "@/features/play/persist";
import { trackPlay } from "@/lib/play-events";
import { buildCountryDraftShareText } from "@/lib/share";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Sheet } from "@/ui/sheet";
import { CountUp } from "@/ui/count-up";
import { ChevronLeftIcon } from "@/ui/icons/chevron-left";
import { MAX_SCORE, SEAT_NAMES, SEAT_WANTS, bandOf } from "@/lib/game-logic/country-draft/tables";
import { poolIndex, seatIndex } from "@/lib/game-logic/country-draft/types";
import type { DraftView } from "@/lib/game-logic/country-draft/public-view";
import type { PoolIdx, SeatIdx } from "@/lib/game-logic/country-draft/types";
import type { HostProps } from "@/games/types";
import type { DraftCommitAction } from "./module";
import type { ServerGameRun } from "@/types/server";
import { Board, type DraftSelection } from "./board";
import { DraftResultDetails, Result } from "./result";
import "./draft.css";

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
  const [rules, setRules] = useState(p.showDraftRules ?? false);
  const [animate, setAnimate] = useState(false);
  const [run, setRun] = useState<ServerGameRun | null>(p.savedRun ?? null);
  const [publishedName, setPublishedName] = useState<string | null>(p.publishedName ?? null);
  const busyRef = useRef(false);
  const mountedAt = useRef(0);
  const moved = useRef(false);
  const closedRules = useCallback(() => {
    document.cookie = "cv_draft_rules_seen=1; Path=/; Max-Age=31536000; SameSite=Lax";
    setRules(false);
  }, []);
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
      if (busy || rules || selection.detail !== null || state.phase === "done") return;
      if (event.target instanceof HTMLElement && (event.target.isContentEditable || event.target.closest("input,textarea,select"))) return;
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
  }, [busy, rules, selection.detail, selection.person, state, onCountry, onOpen, onPerson, onSeat, onCommit, onDrop, onNext]);

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
    <header className="dr-play-header"><Link href="/games/country-draft" aria-label="Back to Country Draft" className="dr-back"><ChevronLeftIcon size={24} /></Link>
      <span className={cn("dr-header-clay", state.phase === "done" && "finished")} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size clay object */}
        <img src={state.phase === "done" ? "/clay/country-draft-done.png" : "/clay/country-draft.png"} width={32} height={32} alt="" />
      </span>
      <h1 className="t-h3">Country Draft</h1><span className="dr-pips" aria-label={`${filled} of 5 seats filled`}>{[0, 1, 2, 3, 4].map((index) => <i key={index} className={index < filled ? "filled" : undefined} />)}</span>
      <b className="dr-header-score t-score"><CountUp value={state.score} duration={750} animate={animate} /> <small>of 195</small></b><button type="button" className="dr-help" onClick={() => setRules(true)} aria-label="How Country Draft works"><span>?</span></button>
    </header>
    {p.mode === "practice" ? <p className="dr-mode-label t-meta">Practice · this round stays off the daily board</p> : null}
    {state.phase !== "done" ? <Board state={state} selection={selection} busy={busy} animate={animate} onCountry={onCountry} onOpen={onOpen} onPerson={onPerson} onSeat={onSeat} onCommit={onCommit} onDrop={onDrop} onNext={onNext} onDetail={onDetail} onReveal={onReveal} /> : <div className="dr-final">
      <Result state={state} shareText={shareText} animate={animate} />
      {run && p.mode === "daily" ? <LeaderboardEntryForm run={run} publishedName={publishedName} onPublished={setRun} /> : null}
      {!run && p.mode === "daily" ? <p className="t-meta">Your score is saved on this device. Reload to restore the leaderboard option.</p> : null}
      {p.mode === "practice" ? <Button block variant="ink" onClick={() => void newPractice()} disabled={busy}>One more draft</Button> : <DailyNext next={nextGame} resetAt={p.resetAt} serverNow={clockOrigin.serverNow} clientStartedAt={clockOrigin.clientNow} />}
      <DraftResultDetails state={state} />
    </div>}
    {error ? <p className="dr-error t-body" role="alert">{error}</p> : null}
    <Sheet open={rules} onClose={closedRules} labelledBy="draft-rules-title" className="dr-rules-sheet" portal={false}><h2 className="t-h2" id="draft-rules-title">How Country Draft works</h2><ol className="t-body"><li>Pick a country, then one of its people.</li><li>Give them a job in your cabinet. Each job can be used once.</li><li>Points show only after you seat them.</li></ol><p className="t-body">Each person earns up to 25 for the job and up to 10 for fame. Every choice is final once you seat them.</p><p className="t-body">Three regions: +6. Mix someone from before 1900 with someone active after 1950: +6. Every job at a fit of 12 or more: +8.</p><div className="dr-rules-jobs">{SEAT_NAMES.map((name, index) => <div key={name}><b className="t-h3">{name}</b><small className="t-meta">{SEAT_WANTS[index]}</small></div>)}</div><Button block variant="ink" onClick={closedRules}>Got it</Button></Sheet>
  </div>;
}
