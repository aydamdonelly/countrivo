"use client";

import { useEffect } from "react";
import type { SpeedFlagsState } from "@/lib/game-logic/speed-flags/engine";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import { CheckIcon } from "@/ui/icons/check";
import { CloseIcon } from "@/ui/icons/close";
import { Clay } from "@/ui/clay";
import type { BoardProps } from "@/games/types";
import { SPEED_SECONDS, TICK_MS, type SpeedAction } from "./module";
import "./board.css";

/** How many flags ahead the board warms the image cache: a flag lives for under half a second. */
const PRELOAD_AHEAD = 3;

function flagSrc(iso2: string): string {
  return `/flags/${iso2.toLowerCase()}.svg`;
}

/**
 * Speed Flags (concept 5.8, pane RF1): the count line, the flag in its 3:2 box, two name
 * rows. Thirty seconds on the wall clock; the header carries the seconds (ember from 5 s,
 * the penalty mark for 600 ms) through the module's progress.
 *
 * The board renders entirely from `state`, so the ready box and its Start button are in the
 * first HTML and nothing appears after hydration. The 300 ms reveal and the 150 ms input lock
 * are the module's feedback window and timed follow-up; while either is open the host holds
 * `busy` and the rows ignore input without changing their look. At time up the board keeps
 * only "Time." above the result.
 */
export function Board({ state, dispatch, busy }: BoardProps<SpeedFlagsState, SpeedAction>) {
  const playing = state.phase === "playing";

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => dispatch({ t: "tick", now: Date.now(), ui: true }), TICK_MS);
    return () => window.clearInterval(id);
  }, [playing, dispatch]);

  // Warm the next few flags so a new one is painted the frame it is dealt.
  const { queue, currentIdx } = state;
  useEffect(() => {
    for (let k = 0; k <= PRELOAD_AHEAD; k++) {
      const q = queue[currentIdx + k];
      if (!q) break;
      const img = new Image();
      img.src = flagSrc(q.country.iso2);
    }
  }, [queue, currentIdx]);

  if (state.phase === "results") return null;

  const count = (
    <p className="sf-count">
      <b key={state.correct} className={cn("t-num num", state.correct > 0 && "num-pop")}>
        {state.correct}
      </b>
      <span className="w t-meta">right</span>
    </p>
  );

  if (state.phase === "ready") {
    return (
      <div className="sf">
        <div className="sf-stage">
          <div className="sf-box ready">
            <Clay object="cl-08" state="full" className="sf-hourglass" sizes="128px" loading="eager" />
            <b className="t-h1 num">{SPEED_SECONDS}s</b>
            <span className="sf-penalty t-meta">Wrong −3s</span>
          </div>
        </div>
        <div className="sf-opts">
          <Button variant="ink" block className="sf-start" onClick={() => dispatch({ t: "start", now: Date.now() })}>
            Start
          </Button>
        </div>
      </div>
    );
  }

  const q = state.queue[state.currentIdx];
  const reveal = state.reveal;
  return (
    <div className="sf">
      <div className="sf-stage">
        {count}
        <div className="sf-box">
          <span className="flag">
            {/* eslint-disable-next-line @next/next/no-img-element -- static SVG assets, no optimisation wanted */}
            <img src={flagSrc(q.country.iso2)} alt="Flag to identify" decoding="sync" loading="eager" />
          </span>
        </div>
      </div>
      <div className={cn("sf-opts", busy && "busy")} role="group" aria-label="Which country is this?">
        {q.options.map((c, i) => {
          const st = reveal && reveal.chosen === i ? (reveal.right ? "right" : "wrong") : "idle";
          return (
            <button key={c.iso3} type="button" className="sf-opt opt" data-state={st} onClick={() => dispatch({ t: "answer", i, now: Date.now() })}>
              <span className="lbl">{c.displayName}</span>
              {st === "right" ? (
                <span className="ic">
                  <CheckIcon size={18} />
                </span>
              ) : st === "wrong" ? (
                <span className="ic">
                  <CloseIcon size={18} />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
