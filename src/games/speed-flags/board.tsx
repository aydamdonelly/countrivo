"use client";

import { useEffect } from "react";
import type { SpeedFlagsState } from "@/lib/game-logic/speed-flags/engine";
import { Button } from "@/ui/button";
import { Mark } from "@/ui/mark";
import { Options, OptionButton } from "@/ui/options";
import { Subject } from "@/ui/subject";
import type { BoardProps } from "@/games/types";
import type { SpeedAction } from "./module";

/** Speed Flags (blueprint 8.8): the ready screen, then 20 seconds of two-option flags. */
export function Board({ state, dispatch, busy }: BoardProps<SpeedFlagsState, SpeedAction>) {
  const playing = state.phase === "playing";
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => dispatch({ t: "tick", now: Date.now(), ui: true }), 1000);
    return () => window.clearInterval(id);
  }, [playing, dispatch]);

  if (state.phase === "ready") {
    return (
      <div className="ready">
        <Mark slug="speed-flags" size={44} />
        <p className="t-body play-line">20 seconds. Two options each. Go.</p>
        <Button variant="ink" onClick={() => dispatch({ t: "start", now: Date.now() })}>
          Start
        </Button>
      </div>
    );
  }

  const q = state.queue[Math.min(state.currentIdx, state.queue.length - 1)];
  return (
    <div className="play-stack">
      <Subject key={state.currentIdx} variant="flag-only" iso2={q.country.iso2} animate={state.currentIdx > 0} />
      <Options grid="2" tall busy={busy}>
        {q.options.map((c, i) => (
          <OptionButton key={c.iso3} label={c.displayName} keyHint={String(i + 1)} onClick={() => dispatch({ t: "answer", i })} />
        ))}
      </Options>
    </div>
  );
}
