"use client";

import { useEffect } from "react";
import type { SpeedFlagsState } from "@/lib/game-logic/speed-flags/engine";
import { Button } from "@/ui/button";
import { Mark } from "@/ui/mark";
import { Options, OptionButton } from "@/ui/options";
import { Subject } from "@/ui/subject";
import type { BoardProps } from "@/games/types";
import { SPEED_SECONDS, TICK_MS, type SpeedAction } from "./module";

/**
 * Speed Flags (blueprint 8.8): the ready screen, then twenty seconds of two-option flags.
 *
 * The round is practice only and it is short, so the frame says so three times over without
 * a word of chrome: the play bar reads `Practice · doesn't count`, the session bar stands
 * full at `time 20 s` before the clock starts and drains from the first second, and the
 * ready line puts the twenty seconds in ink while the rest of it stays mute.
 *
 * The clock is wall-clock (`endsAt`), never a counter, so a backgrounded tab cannot pause
 * the round: the interval only asks the engine what time it is, and the module folds a read
 * that changes nothing back to the same state.
 *
 * Both screens render entirely from `state`, so the ready screen is in the first HTML with
 * its button live; nothing appears after hydration. There is no feedback window here (a
 * blocking reveal would eat the round), so the answer lands and the next flag arrives on
 * the same frame; the verdict line carries `Right.` or `Wrong.`
 */
export function Board({ state, dispatch, busy }: BoardProps<SpeedFlagsState, SpeedAction>) {
  const playing = state.phase === "playing";
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => dispatch({ t: "tick", now: Date.now(), ui: true }), TICK_MS);
    return () => window.clearInterval(id);
  }, [playing, dispatch]);

  if (state.phase === "ready") {
    return (
      <div className="ready">
        <Mark slug="speed-flags" size={44} />
        <p className="t-body play-line">
          <b>{SPEED_SECONDS} seconds.</b> Two options each. Go.
        </p>
        <Button variant="ink" onClick={() => dispatch({ t: "start", now: Date.now() })}>
          Start
        </Button>
      </div>
    );
  }

  const q = state.queue[Math.min(state.currentIdx, state.queue.length - 1)];
  return (
    <div className="play-stack">
      <Subject key={state.currentIdx} variant="flag-only" iso2={q.country.iso2} animate />
      {/* Full-width rows on the phone: at 350 px two columns would cut `Bosnia and
          Herzegovina` and `Central African Republic` down to the same ellipsis and the
          answer would be unreadable. The 720 px play column has the room, so the pair sits
          side by side from 1024 up. */}
      <Options tall busy={busy} className="lg:grid lg:grid-cols-2">
        {q.options.map((c, i) => (
          <OptionButton key={c.iso3} label={c.displayName} keyHint={String(i + 1)} onClick={() => dispatch({ t: "answer", i })} />
        ))}
      </Options>
    </div>
  );
}
