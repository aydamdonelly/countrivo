import { useEffect, useRef, useState } from "react";
import type { FlagSprintView, QuickAction } from "@/games/quick-views";
import { cn } from "@/lib/utils";
import { clayFlagSrc } from "@/lib/flag-assets";
import { Button } from "@/ui/button";
import { Clay } from "@/ui/clay";
import "./flag-quiz.css";

/** Under this many ms the clock turns ember. */
const HOT_MS = 5000;
const TICK_MS = 100;

/** `14.2`: tenths, rounded up so the clock reads 0.0 only when it has run out. */
function clockText(ms: number): string {
  return (Math.ceil(Math.max(0, ms) / 100) / 10).toFixed(1);
}

function serverLeft(view: FlagSprintView): number {
  return view.deadline === null ? view.seconds * 1000 : view.deadline - view.serverNow;
}

/**
 * The Flag Quiz sprint board. Everything renders from the server view, so the first HTML
 * already shows the ready card or the running flag. The countdown is derived from the
 * server's deadline and the server time the view was made at: the client only adds the time
 * elapsed since it received the view. When the countdown reaches zero the board asks the
 * server to close the run; the server decides on its own clock either way.
 */
export function Board({ view, busy, pendingChoice, send }: { view: FlagSprintView; busy: boolean; pendingChoice?: number | null; send: (action: QuickAction) => Promise<void> }) {
  const running = view.stage === "running" && view.deadline !== null;
  // The time left as last measured for this view; a new view starts from its own server values.
  const [tick, setTick] = useState(() => ({ view, left: serverLeft(view) }));
  const left = tick.view === view ? tick.left : serverLeft(view);
  const finishedFor = useRef<FlagSprintView | null>(null);
  const out = running && left <= 0;

  useEffect(() => {
    if (view.stage !== "running" || view.deadline === null) return;
    const deadline = view.deadline;
    const offset = view.serverNow - Date.now();
    const measure = () => setTick({ view, left: deadline - (Date.now() + offset) });
    measure();
    const id = window.setInterval(measure, TICK_MS);
    return () => window.clearInterval(id);
  }, [view]);

  // Time is up on this client: close the run once per view, after any answer in flight.
  useEffect(() => {
    if (!out || busy || finishedFor.current === view) return;
    finishedFor.current = view;
    void send({ t: "finish" });
  }, [out, busy, view, send]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (view.stage === "ready" && (event.key === "Enter" || event.key === " ")) {
        if (target instanceof HTMLButtonElement) return;
        event.preventDefault();
        if (!busy) void send({ t: "start" });
        return;
      }
      if (view.stage !== "running" || busy || out) return;
      const i = Number(event.key) - 1;
      if (Number.isInteger(i) && i >= 0 && i < view.options.length) {
        event.preventDefault();
        void send({ t: "answer", i });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, busy, out, send]);

  if (view.stage === "ready") {
    return (
      <div className="fs" data-stage="ready">
        <div className="fs-ready">
          <Clay object="cl-05" state="wave1" alternate="wave2" className="fs-clay" sizes="128px" loading="eager" />
          <p className="fs-seconds"><b className="t-big num">{view.seconds}</b><span className="t-h3">seconds</span></p>
          <p className="t-body fs-rule">Name as many flags as you can. Four names per flag.</p>
          <ul className="fs-chips t-meta" aria-label="Rules">
            <li>Wrong answer: <b className="num">−{view.penaltySeconds} s</b></li>
            <li>{view.mode === "daily" ? "Same flags for everyone today" : "New flags every run"}</li>
            <li>{view.mode === "daily" ? <>Today’s target: <b className="num">{view.target}</b></> : <>Target: <b className="num">{view.target}</b></>}</li>
          </ul>
        </div>
        <div className="fs-start">
          {view.mode === "daily" ? <p className="t-meta text-mute">One run a day. The clock starts when you press Start.</p> : null}
          <Button block variant="primary" className="fs-start-button" disabled={busy} pending={busy} pendingLabel="Starting…" onClick={(event) => { if (event.detail < 2) void send({ t: "start" }); }}>Start</Button>
        </div>
      </div>
    );
  }

  if (view.stage !== "running" || !view.flagSrc) return null;
  const ms = Math.max(0, left);
  const fraction = Math.max(0, Math.min(1, ms / (view.seconds * 1000)));
  const missed = view.last && !view.last.correct;
  return (
    <div className="fs" data-stage="running" data-hot={ms <= HOT_MS || undefined}>
      <div className="fs-head">
        <p className="fs-clock" role="timer" aria-label={`${Math.ceil(ms / 1000)} seconds left`}>
          <b className="t-score-l num" suppressHydrationWarning>{clockText(ms)}</b><span className="t-meta">s</span>
        </p>
        <p className="fs-count"><b key={view.correct} className={cn("t-score num", view.correct > 0 && "num-pop")}>{view.correct}</b><span className="t-meta">right</span></p>
      </div>
      <div className="fs-bar" aria-hidden="true"><i style={{ transform: `scaleX(${fraction})` }} /></div>
      <p className="fs-last t-meta" aria-live="polite">
        {missed ? <span key={view.round} className="fs-penalty"><b className="num">−{view.penaltySeconds} s</b> That was {view.last?.answer}.</span> : view.last ? <span key={view.round}>Right: {view.last.answer}.</span> : <span>&nbsp;</span>}
      </p>
      <div className="fs-box"><span className="flag">
        {/* eslint-disable-next-line @next/next/no-img-element -- opaque filename deliberately never identifies the flag */}
        <img key={view.flagSrc} src={clayFlagSrc(view.flagSrc)} alt="Flag to identify" width={640} height={480} decoding="async" fetchPriority="high" />
      </span></div>
      <div className="fs-opts" role="group" aria-label="Which country has this flag?">
        {view.options.map((option, i) => (
          <button type="button" className="opt fs-opt t-list" key={`${view.round}-${option}`} disabled={busy || out} aria-pressed={pendingChoice === i} onClick={() => void send({ t: "answer", i })}>
            <span className="lbl">{option}</span>
            <span className="key num" aria-hidden="true">{i + 1}</span>
          </button>
        ))}
      </div>
      {out ? <p className="fs-time t-h3" role="status">Time’s up</p> : null}
    </div>
  );
}
