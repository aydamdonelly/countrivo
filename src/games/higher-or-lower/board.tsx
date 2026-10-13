"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { juice } from "@/hooks/use-juice";
import { cn } from "@/lib/utils";
import { Flag } from "@/ui/flag";
import { KeyHint } from "@/ui/key-hint";
import { ArrowUpRightIcon } from "@/ui/icons/arrow-up-right";
import { CheckIcon } from "@/ui/icons/check";
import { CrossIcon } from "@/ui/icons/cross";
import { StatIcon } from "@/ui/icons/stat";
import { DOUBLE_FROM, type HoLCard } from "@/lib/game-logic/higher-or-lower/engine";
import type { BoardProps } from "@/games/types";
import {
  ADVANCE,
  TICK_MS,
  cardValue,
  comparisonLine,
  pairInView,
  sourceLine,
  statLine,
  unitLine,
  type Call,
  type HoLAction,
  type HoLState,
} from "./module";
import { Tick } from "./tick";

/** The deal: the revealed card slides into the left (top) seat (concept 3.7, smooth). */
const SLIDE_MS = 260;
const EASE_OUT = "cubic-bezier(0.2, 0, 0, 1)";

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The board (HL1 call stage, HL2 reveal). Phone: the stat line, two stacked cards, the
 * comparison line, and Higher and Lower pinned at the bottom. Desktop: the cards side by
 * side, the buttons under the right card, the key hint (then the comparison line) under the
 * left one.
 *
 * A call opens the host's reveal window: the right value ticks in over 900 ms, then the
 * verdict word lands on the card and the comparison line under the pair; after the hold the
 * host deals the next pair and the revealed card slides into the left seat. A tap after the
 * tick skips the hold. Everything is derived from `state`, so the server HTML is the live
 * board and a resumed daily paints its current pair in the first frame.
 */
export function Board({ state, dispatch, busy }: BoardProps<HoLState, HoLAction>) {
  const g = state.g;
  const pair = pairInView(state);
  const revealing = state.rev;
  const chosen: Call | null = revealing ? g.calls[pair.index] : null;
  const hit = chosen !== null && chosen === pair.answer;
  const doubled = g.mode === "daily" && pair.index >= DOUBLE_FROM;

  // The verdict beat: which call's verdict is on screen. It lands when the tick ends.
  const [told, setTold] = useState<number | null>(null);
  const isTold = revealing && told === pair.index;
  useEffect(() => {
    if (!revealing) return;
    const index = pair.index;
    const id = window.setTimeout(
      () => {
        setTold(index);
        if (hit) juice.correct();
        else juice.wrong();
      },
      reducedMotion() ? 0 : TICK_MS,
    );
    return () => window.clearTimeout(id);
  }, [revealing, pair.index, hit]);

  // The deal: when the next pair arrives, the left card flies in from where the revealed
  // card stood and the new challenger settles in beside it. Transform only; both cards are
  // fully painted the whole time.
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const lastIndex = useRef(pair.index);
  useLayoutEffect(() => {
    const prev = lastIndex.current;
    lastIndex.current = pair.index;
    if (revealing || pair.index !== prev + 1 || reducedMotion()) return;
    const l = leftRef.current;
    const r = rightRef.current;
    if (!l || !r || typeof l.animate !== "function") return;
    const lr = l.getBoundingClientRect();
    const rr = r.getBoundingClientRect();
    const dx = rr.left - lr.left;
    const dy = rr.top - lr.top;
    l.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }], { duration: SLIDE_MS, easing: EASE_OUT });
    r.animate([{ transform: dx > 0 ? "translateX(24px)" : "translateY(16px)" }, { transform: "translate(0, 0)" }], { duration: SLIDE_MS, easing: EASE_OUT });
  }, [pair.index, revealing]);

  const live = !busy && !revealing;
  const press = (c: Call) => {
    if (isTold) dispatch(ADVANCE);
    else if (live) dispatch({ t: "guess", c });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="t-list flex items-center gap-2 font-medium text-ink">
          <StatIcon slug={g.stat} size={22} />
          <span>{statLine(g)}</span>
        </p>
        {doubled ? <p className="t-meta mt-0.5 text-mute">Counts double</p> : null}
      </div>

      <div className="relative grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-x-10">
        <Card ref={leftRef} card={pair.left} unit={unitLine(g)} className="z-10">
          {cardValue(g.stat, pair.left.value)}
        </Card>
        <Card
          ref={rightRef}
          card={pair.right}
          unit={unitLine(g)}
          verdict={isTold ? (hit ? "right" : "wrong") : null}
        >
          {revealing ? <Tick key={pair.index} stat={g.stat} value={pair.right.value} ms={TICK_MS} /> : "?"}
        </Card>

        <div className="min-h-12" role="status" aria-live="polite">
          {isTold ? (
            <>
              <span className="sr-only">{hit ? "Right. " : "Wrong. "}</span>
              <p className="t-body text-ink">{comparisonLine(g, pair.index)}</p>
              <p className="t-meta text-mute">{sourceLine(g)}</p>
            </>
          ) : (
            <KeyHint className="mt-0">Up or H for Higher. Down or L for Lower.</KeyHint>
          )}
        </div>

        {/* Phone: pinned to the bottom of the screen; desktop: under the right card. */}
        <div className="fixed inset-x-0 bottom-0 z-20 bg-paper px-5 pt-3 pb-8 lg:static lg:z-auto lg:bg-transparent lg:p-0">
          <div className="mx-auto flex max-w-150 flex-col gap-2 lg:max-w-none" role="group" aria-label="Your call">
            <CallButton dir="higher" chosen={chosen === "higher"} actionable={live || isTold} onPress={() => press("higher")} />
            <CallButton dir="lower" chosen={chosen === "lower"} actionable={live || isTold} onPress={() => press("lower")} />
          </div>
        </div>

        {isTold ? (
          <button
            type="button"
            className="absolute inset-0 z-20 cursor-pointer"
            aria-label="Next pair"
            onClick={() => dispatch(ADVANCE)}
          />
        ) : null}
      </div>
      {/* Room under the content for the pinned buttons on phones. */}
      <div className="h-36 lg:hidden" aria-hidden="true" />
    </div>
  );
}

interface CardProps {
  ref?: Ref<HTMLDivElement>;
  card: HoLCard;
  unit: string;
  verdict?: "right" | "wrong" | null;
  className?: string;
  children: ReactNode;
}

/** One country: flag and name, the value in Erode, the unit and year under it. */
function Card({ ref, card, unit, verdict, className, children }: CardProps) {
  return (
    <div ref={ref} className={cn("relative flex min-h-35 flex-col rounded-card bg-card p-4", className)}>
      <div className="flex items-center gap-3">
        <Flag iso2={card.iso2} size="s" alt="" eager />
        <span className="t-h3 min-w-0 flex-1 text-ink">{card.name}</span>
        {verdict === "right" ? (
          <span className="t-h3 flex flex-none items-center gap-1 text-ink">
            <CheckIcon size={18} />
            Right
          </span>
        ) : verdict === "wrong" ? (
          <span className="t-h3 flex flex-none items-center gap-1 text-ember">
            <CrossIcon size={18} />
            Wrong
          </span>
        ) : null}
      </div>
      <div className="mt-auto pt-4">
        <p className="t-score-l text-4xl leading-none text-ink lg:text-5xl">{children}</p>
        <p className="t-meta mt-1 text-mute">{unit}</p>
      </div>
    </div>
  );
}

interface CallButtonProps {
  dir: Call;
  chosen: boolean;
  actionable: boolean;
  onPress: () => void;
}

/**
 * Higher or Lower: 56 px, full width, card fill, the house up-right arrow turned to point
 * up or down. The chosen one fills ink during the reveal. Only the fill changes on hover
 * and press; the arrow slides 3 px where hover exists.
 */
function CallButton({ dir, chosen, actionable, onPress }: CallButtonProps) {
  const up = dir === "higher";
  return (
    <button
      type="button"
      onClick={onPress}
      aria-disabled={!actionable}
      aria-pressed={chosen}
      className={cn(
        "group flex h-14 w-full items-center justify-center gap-2 rounded-ctl text-base font-semibold transition-colors",
        chosen ? "bg-ink text-paper" : "bg-card text-ink",
        actionable && !chosen && "hover:bg-line active:bg-ink-2 active:text-paper",
        !actionable && "cursor-default",
      )}
    >
      <span
        className={cn(
          "inline-flex transition-transform",
          up ? "-rotate-45 group-hover:-translate-y-0.75" : "rotate-135 group-hover:translate-y-0.75",
        )}
      >
        <ArrowUpRightIcon size={18} />
      </span>
      {up ? "Higher" : "Lower"}
    </button>
  );
}
