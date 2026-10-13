"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  coarseStep,
  nearestStep,
  positionOf,
  rulerFor,
  type SgPlace,
  type StatGuesserRound,
  type StatGuesserState,
} from "@/lib/game-logic/stat-guesser/engine";
import { Button } from "@/ui/button";
import { CountUp } from "@/ui/count-up";
import { Flag } from "@/ui/flag";
import { StatIcon } from "@/ui/icons/stat";
import type { BoardProps } from "@/games/types";
import { contextLine, gapText, statLine, valueText } from "./format";
import type { GuesserAction } from "./module";
import "./ruler.css";

type Side = "left" | "right";

/** The pin labels hang this far off their mark; the knob's label clears the 20 px knob. */
const GAP = 6;
const KNOB_GAP = 16;
/** Labels may use the ruler's inset (the 14 px either side of the marks). */
const BLEED = 14;

/** A 16 px flag (the Flag primitive starts at 24). Same markup, so the inset ring applies. */
function MiniFlag({ iso2 }: { iso2: string }) {
  if (!iso2) return null;
  return (
    <span className="flag" style={{ width: 16, height: 12 }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG asset, no optimisation wanted */}
      <img src={`/flags/${iso2.toLowerCase()}.svg`} width={16} height={12} alt="" loading="eager" decoding="async" />
    </span>
  );
}

/**
 * A label hanging off a mark at `pos` (0 to 1). The server HTML hangs it on the preferred side
 * with a transform; after layout `layoutRuler` measures it and moves it to whichever side keeps
 * it inside the ruler (and, for the pin's label, clear of the end values). It never leaves
 * the column.
 */
function HangingLabel({
  pos,
  prefer,
  gap = GAP,
  avoidEnds,
  className,
  children,
}: {
  pos: number;
  prefer: Side;
  gap?: number;
  avoidEnds?: boolean;
  className: string;
  children: ReactNode;
}) {
  const transform = prefer === "left" ? `translateX(calc(-100% - ${gap}px))` : `translateX(${gap}px)`;
  return (
    <span
      className={cn("sg-label", className)}
      style={{ left: `${pos * 100}%`, transform }}
      data-hang=""
      data-pos={pos}
      data-prefer={prefer}
      data-gap={gap}
      data-avoid={avoidEnds ? "ends" : undefined}
    >
      {children}
    </span>
  );
}

/**
 * One layout pass over the ruler. The two end values give way to the knob when it reaches
 * them (the live value and the pin label already say what the pin reads), and every hanging
 * label is placed on its preferred side when it fits, the other side when that fits, or
 * clamped inside the ruler.
 */
function layoutRuler(box: HTMLDivElement, pinPos: number): void {
  const W = box.clientWidth;
  const knobX = pinPos * W;
  const ends = Array.from(box.querySelectorAll<HTMLElement>(".sg-end"));
  let loLimit = -BLEED;
  let hiLimit = W + BLEED;
  for (const end of ends) {
    const w = end.offsetWidth;
    const isLo = end.classList.contains("lo");
    const from = isLo ? -BLEED : W + BLEED - w;
    const to = from + w;
    const hit = knobX + 12 + 6 > from && knobX - 12 - 6 < to;
    end.style.visibility = hit ? "hidden" : "visible";
    if (!hit) {
      if (isLo) loLimit = to + 8;
      else hiLimit = from - 8;
    }
  }
  for (const el of Array.from(box.querySelectorAll<HTMLElement>("[data-hang]"))) {
    el.style.transform = "none";
    el.style.left = "0px";
    const pos = Number(el.dataset.pos ?? 0);
    const gap = Number(el.dataset.gap ?? GAP);
    const prefer = el.dataset.prefer === "left" ? "left" : "right";
    const lo = el.dataset.avoid === "ends" ? loLimit : -BLEED;
    const hi = el.dataset.avoid === "ends" ? hiLimit : W + BLEED;
    const w = el.offsetWidth;
    const x = pos * W;
    const leftStart = x - gap - w;
    const rightStart = x + gap;
    const fitsLeft = leftStart >= lo;
    const fitsRight = rightStart + w <= hi;
    let start: number;
    if (prefer === "left") start = fitsLeft ? leftStart : fitsRight ? rightStart : x - w / 2;
    else start = fitsRight ? rightStart : fitsLeft ? leftStart : x - w / 2;
    start = Math.max(Math.min(start, hi - w), lo);
    el.style.left = `${start}px`;
  }
}

function at(pos: number) {
  return { left: `${pos * 100}%` };
}

/** A reference pin: mute tick, flag 16 and short name above it, hanging outward. */
function RefMark({ place, pos, prefer }: { place: SgPlace; pos: number; prefer: Side }) {
  return (
    <>
      <span className="sg-mark sg-ref" style={at(pos)} aria-hidden="true">
        <span className="sg-tick" />
      </span>
      <HangingLabel pos={pos} prefer={prefer} className="row-ref t-meta">
        <MiniFlag iso2={place.iso2} />
        {place.name}
      </HangingLabel>
    </>
  );
}

interface StageProps {
  state: StatGuesserState;
  round: StatGuesserRound;
  dispatch: (a: GuesserAction) => void;
  busy: boolean;
  last: boolean;
}

/**
 * One round (panes SG1 and SG2). The pin is board-local until it is locked: the reducer only
 * ever sees the step it was locked on. The stage is keyed by round, so the pin starts at the
 * ruler's centre every round.
 */
function Stage({ state, round, dispatch, busy, last }: StageProps) {
  const ruler = rulerFor(round.stat);
  const reveal = state.phase === "reveal";
  const guess = state.guesses[state.currentRound];
  const points = state.points[state.currentRound] ?? 0;

  const [pin, setPin] = useState(ruler.centre);
  const pinRef = useRef(pin);
  useLayoutEffect(() => {
    pinRef.current = pin;
  }, [pin]);
  const box = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  // The reveal animates only when it happens in front of the player, never on a resumed board.
  const [lockedHere, setLockedHere] = useState(false);

  const live = !reveal && !busy;
  const pinValue = reveal && guess !== null ? guess : ruler.steps[pin];
  const pinPos = positionOf(ruler, pinValue);
  const truthPos = positionOf(ruler, round.actualValue);

  // Place the labels after every render, and again whenever the ruler changes width.
  const pinPosRef = useRef(pinPos);
  useLayoutEffect(() => {
    pinPosRef.current = pinPos;
    if (box.current) layoutRuler(box.current, pinPos);
  });
  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => layoutRuler(el, pinPosRef.current));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const lock = useCallback(() => {
    if (!live) return;
    setLockedHere(true);
    dispatch({ t: "lock", i: pinRef.current });
  }, [live, dispatch]);

  const stepAt = (clientX: number): number => {
    const el = box.current;
    if (!el) return pinRef.current;
    const rect = el.getBoundingClientRect();
    return nearestStep(ruler, (clientX - rect.left) / Math.max(1, rect.width));
  };

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!live || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    setPin(stepAt(e.clientX));
    knob.current?.focus({ preventScroll: true });
  }
  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging.current || !live) return;
    setPin(stepAt(e.clientX));
  }
  function onPointerEnd(e: ReactPointerEvent<HTMLDivElement>) {
    dragging.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }

  // Desktop keys while the pin is live: arrows step 1, 2, 5 per decade (5 points on a
  // percentage), Shift takes a fine step, Home and End jump to the ends, Enter locks.
  useEffect(() => {
    if (!live) return;
    const lastStep = ruler.steps.length - 1;
    const clamp = (i: number) => Math.min(lastStep, Math.max(0, i));
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) return;
      let move: ((cur: number) => number) | null = null;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") move = (cur) => (e.shiftKey ? cur + 1 : coarseStep(ruler, cur, 1));
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") move = (cur) => (e.shiftKey ? cur - 1 : coarseStep(ruler, cur, -1));
      else if (e.key === "Home") move = () => 0;
      else if (e.key === "End") move = () => lastStep;
      else if (e.key === "Enter") {
        // A focused button answers Enter itself.
        if (target && (target.tagName === "BUTTON" || target.tagName === "A")) return;
        if (e.repeat) return;
        e.preventDefault();
        lock();
        return;
      }
      if (move === null) return;
      e.preventDefault();
      const step = move;
      setPin((cur) => clamp(step(cur)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [live, ruler, lock]);

  const [lo, hi] = round.refs;
  const shown = reveal ? round.actualValue : pinValue;
  const routeFrom = Math.min(pinPos, truthPos);
  const routeTo = Math.max(pinPos, truthPos);

  return (
    <div className={cn("sg", reveal && "is-reveal")}>
      <div className="sg-q">
        <div className="sg-name">
          <Flag iso2={round.country.iso2} size="s" alt="" eager />
          <b className="t-h2">{round.country.name}</b>
        </div>
        <p className="sg-stat t-body">
          <StatIcon slug={round.stat} size={16} />
          <span>{statLine(round.stat)}</span>
        </p>
      </div>

      <div className="sg-live">
        <span className="cap t-body">{reveal ? "The answer" : "about"}</span>
        <b className="t-big num">{valueText(round.stat, shown)}</b>
      </div>

      <div
        className={cn("sg-ruler", !live && "done")}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <div className="sg-box" ref={box}>
          <span className="sg-line" aria-hidden="true" />
          <span className="sg-end lo t-meta" aria-hidden="true">
            {valueText(round.stat, ruler.min)}
          </span>
          <span className="sg-end hi t-meta" aria-hidden="true">
            {valueText(round.stat, ruler.max)}
          </span>

          <RefMark place={lo} pos={positionOf(ruler, lo.value)} prefer="left" />
          <RefMark place={hi} pos={positionOf(ruler, hi.value)} prefer="right" />

          {reveal ? (
            <>
              {round.context.map((c) => (
                <span key={c.iso3} className="sg-mark sg-ctx" style={at(positionOf(ruler, c.value))} aria-hidden="true">
                  <span className="sg-dot" />
                </span>
              ))}
              {routeTo - routeFrom > 0.004 ? (
                <svg
                  className={cn("sg-route", lockedHere && (truthPos >= pinPos ? "to-right" : "to-left"))}
                  style={{ left: `${routeFrom * 100}%`, width: `${(routeTo - routeFrom) * 100}%` }}
                  height="8"
                  aria-hidden="true"
                >
                  <line x1="0" x2="100%" y1="4" y2="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="0 6" />
                </svg>
              ) : null}
              <span className={cn("sg-mark sg-truth", lockedHere && "drop")} style={at(truthPos)} aria-hidden="true">
                <span className="sg-tick" />
                <span className="sg-dot" />
              </span>
              <HangingLabel pos={truthPos} prefer={truthPos > 0.5 ? "left" : "right"} className="row-truth t-meta">
                <MiniFlag iso2={round.country.iso2} />
                {round.country.name}
                <b className="t-num">{valueText(round.stat, round.actualValue)}</b>
              </HangingLabel>
              <HangingLabel pos={pinPos} prefer={pinPos <= truthPos ? "left" : "right"} gap={KNOB_GAP} avoidEnds className="row-pin t-meta">
                {valueText(round.stat, pinValue)}
              </HangingLabel>
            </>
          ) : null}

          <span className="sg-mark sg-pin" style={at(pinPos)}>
            <span className="sg-tick" aria-hidden="true" />
            <div
              ref={knob}
              className="sg-knob"
              role="slider"
              tabIndex={live ? 0 : -1}
              aria-label={`Your guess for ${round.country.name}`}
              aria-valuemin={0}
              aria-valuemax={ruler.steps.length - 1}
              aria-valuenow={reveal ? undefined : pin}
              aria-valuetext={`about ${valueText(round.stat, pinValue)}`}
              aria-disabled={!live || undefined}
            >
              <i />
            </div>
          </span>
        </div>
      </div>

      {reveal && guess !== null ? (
        <div className="sg-foot">
          <div className="sg-out">
            <p className="gap t-body" role="status">
              {gapText(round.stat, guess, round.actualValue)}
            </p>
            <span className="pts">
              <CountUp value={points} duration={750} animate={lockedHere} className="t-h1" />
              <span className="of t-body">of 100{state.currentRound === state.rounds.length - 1 ? ", counts double" : ""}</span>
            </span>
            <p className="ctx t-meta">{contextLine(round.context.map((c) => c.name))}</p>
          </div>
          <div className="sg-act">
            <Button variant="ink" className="sg-cta" onClick={() => dispatch({ t: "next" })} disabled={busy}>
              {last ? "See result" : "Next"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="sg-act">
          <Button variant="ink" className="sg-cta" onClick={lock} disabled={busy}>
            Lock it
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Stat Guesser (concept 5.6): one country, one stat, a ruler with two fixed reference
 * countries. Drag the pin (or use the arrow keys), lock it, read the gap and the points.
 * Everything renders from `state`: a resumed board arrives on the round and phase it left.
 */
export function Board({ state, dispatch, busy }: BoardProps<StatGuesserState, GuesserAction>) {
  const round = state.rounds[state.currentRound];
  return (
    <Stage
      key={state.currentRound}
      state={state}
      round={round}
      dispatch={dispatch}
      busy={busy}
      last={state.currentRound === state.rounds.length - 1}
    />
  );
}
