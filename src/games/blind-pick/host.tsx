"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { commitBlindSession, startBlindPractice } from "@/app/actions/blind-session";
import { computeResult, overLabel, placementMark } from "@/lib/game-logic/blind-pick/scoring";
import { isComplete, PICK_COUNT } from "@/lib/game-logic/blind-pick/display";
import { buildBlindPickShareText } from "@/lib/share";
import { trackPlay } from "@/lib/play-events";
import { Button } from "@/ui/button";
import { Progress } from "@/ui/progress";
import { ResultPanel } from "@/ui/result-panel";
import { ShareButton } from "@/ui/share-button";
import { LeaderboardEntryForm } from "@/features/play/leaderboard-entry";
import type { HostProps } from "@/games/types";
import type { ServerGameRun } from "@/types/server";
import type { BlindPickAction, BlindPickState } from "./module";
import { Board } from "./board";
import { Result } from "./result";

export function BlindPickHost(p: HostProps) {
  if (!p.blindPickView || !p.sessionToken) return <p className="t-body">This board could not be opened. <Link href="/games/blind-pick/play?mode=practice">Try again</Link></p>;
  return <BlindSession {...p} initialView={p.blindPickView} initialToken={p.sessionToken} />;
}

function BlindSession(p: HostProps & { initialView: BlindPickState; initialToken: string }) {
  const [state, setState] = useState(p.initialView);
  const [token, setToken] = useState(p.initialToken);
  const [revision, setRevision] = useState(p.sessionRevision ?? 0);
  const [run, setRun] = useState<ServerGameRun | null>(p.savedRun ?? null);
  const [busy, setBusy] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [animate, setAnimate] = useState(false);
  const busyRef = useRef(false);
  const started = useRef(false);
  const complete = isComplete(state.g);
  const finished = complete && state.seen;
  const send = useCallback(async (action: BlindPickAction) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setPendingSlot(action.t === "place" ? action.s : null); setError(null);
    if (!started.current) { started.current = true; trackPlay("play_start", "blind-pick", p.mode); }
    try {
      const response = await commitBlindSession({ sessionToken: token, revision, action });
      setState(response.view); setToken(response.sessionToken); setRevision(response.revision);
      if (response.run) setRun(response.run);
      if (response.success) setAnimate(true);
      if (!response.success) setError(response.error ?? "Your placement could not be saved. Try again.");
      else if (response.view.seen) trackPlay("play_finish", "blind-pick", p.mode);
    } catch { setError("Your placement was not confirmed. Check your connection and try again."); }
    finally { busyRef.current = false; setBusy(false); setPendingSlot(null); }
  }, [token, revision, p.mode]);

  useEffect(() => {
    if (!complete || finished || busy || error) return;
    void send({ t: "seen" });
  }, [complete, finished, busy, error, send]);

  useEffect(() => {
    if (busy || finished) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      if (event.target instanceof HTMLElement && (event.target.isContentEditable || event.target.closest("input,textarea,select"))) return;
      const slot = Number(event.key) - 1;
      if (!complete && Number.isInteger(slot) && slot >= 0 && slot < PICK_COUNT && !state.g.placements.includes(slot)) { event.preventDefault(); void send({ t: "place", s: slot }); }
      else if (complete && event.key === "Enter") { event.preventDefault(); void send({ t: "seen" }); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, finished, complete, state.g.placements, send]);

  async function practice() {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(null);
    try { const response = await startBlindPractice(); setState(response.view); setToken(response.sessionToken); setRevision(response.revision); setRun(response.run ?? null); setAnimate(false); started.current = false; }
    catch { setError("The next board could not be opened. Try again."); }
    finally { busyRef.current = false; setBusy(false); }
  }

  const result = finished ? computeResult(state.g) : null;
  const shareText = result ? buildBlindPickShareText({ over: result.over, marks: result.placements.map((slot, country) => placementMark(slot, result.ranks[country], result.perfect[country], result.perfectRanks[country])), practice: p.mode === "practice" }, p.dateKey) : "";
  return <div className="play-stack blind-remote" aria-busy={busy}>
    {finished && result ? <ResultPanel mode={p.mode} game="Blind Pick" score={overLabel(result.over)} animateScore={animate} actions={<><Button variant="ink" onClick={() => void practice()} disabled={busy}>One more</Button><ShareButton text={shareText} onShare={() => trackPlay("share", "blind-pick", p.mode)} /></>}>
      {run && p.mode === "daily" ? <LeaderboardEntryForm run={run} publishedName={p.publishedName} onPublished={setRun} /> : null}
      <Result state={state} mode={p.mode} run={run} />
    </ResultPanel> : <><Progress done={state.g.placements.length} total={PICK_COUNT} label="placed" value={`${state.g.placements.length} of ${PICK_COUNT}`} /><Board state={state} dispatch={(action) => void send(action)} busy={busy} pendingSlot={pendingSlot} mode={p.mode} viewer={p.viewer} seed={0} />{complete && error ? <Button variant="ink" onClick={() => void send({ t: "seen" })} disabled={busy}>See result</Button> : null}</>}
    <span className="sr-only" role="status">{pendingSlot !== null ? "Placement selected. Waiting for confirmation." : busy ? "Opening result." : ""}</span>
    {error ? <p className="t-body text-ember" role="alert">{error}</p> : null}
  </div>;
}
