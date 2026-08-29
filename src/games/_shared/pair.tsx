"use client";

import { useRef, type TouchEvent } from "react";
import { StatIcon } from "@/ui/icons/stat";
import { Subject, type PairSide } from "@/ui/subject";

export interface PairSubjectProps {
  stat: { slug: string; label: string };
  /** `x2.25` beside the stat (Risk Zone). */
  multiplier?: string;
  left: PairSide;
  right: PairSide;
  /** A vertical swipe of 40 px or more on the pair: up = higher, down = lower (blueprint 8.5). */
  onSwipe?: (dir: "higher" | "lower") => void;
  animate?: boolean;
}

/** The stat line (StatIcon 22 + label) over a Subject pair, with the touch swipe and its touch-only hint. */
export function PairSubject({ stat, multiplier, left, right, onSwipe, animate }: PairSubjectProps) {
  const startY = useRef<number | null>(null);
  function onStart(e: TouchEvent<HTMLDivElement>) {
    startY.current = e.touches[0]?.clientY ?? null;
  }
  function onEnd(e: TouchEvent<HTMLDivElement>) {
    if (startY.current === null || !onSwipe) return;
    const y = e.changedTouches[0]?.clientY;
    if (y === undefined) return;
    const dy = startY.current - y;
    startY.current = null;
    if (Math.abs(dy) >= 40) onSwipe(dy > 0 ? "higher" : "lower");
  }
  return (
    <div className="pair-wrap play-stack" onTouchStart={onSwipe ? onStart : undefined} onTouchEnd={onSwipe ? onEnd : undefined}>
      <div className="stat-line t-list">
        <StatIcon slug={stat.slug} size={22} />
        <span>{stat.label}</span>
        {multiplier ? <b className="mult t-num num">{multiplier}</b> : null}
      </div>
      <Subject variant="pair" left={left} right={right} animate={animate} />
      {onSwipe ? <p className="touch-only t-meta">swipe up for higher, down for lower</p> : null}
    </div>
  );
}
