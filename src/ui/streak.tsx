"use client";

import { useState } from "react";
import { Flame } from "@/ui/flame";

export interface StreakProps {
  /** profiles.streak_current; null for guests. */
  n: number | null;
  className?: string;
}

/**
 * The flame with the streak count (blueprint 3.3). The flame always burns and is always
 * ember; the number renders only when n > 0 (guests and members at 0 see the flame alone,
 * never "0"). When n increments after a submit response the number beats once,
 * scale 1 to 1.08 to 1 over 350 ms (the element is re-keyed so the animation replays).
 */
export function Streak({ n, className }: StreakProps) {
  const [prev, setPrev] = useState(n);
  const [beat, setBeat] = useState(0);
  if (n !== prev) {
    setPrev(n);
    if (n != null && prev != null && n > prev) setBeat((b) => b + 1);
  }
  const show = n != null && n > 0;
  return (
    <span className={className ? `st ${className}` : "st"} title={show ? `${n} day streak` : undefined}>
      <Flame size={18} />
      {show ? (
        <b key={beat} className={beat > 0 ? "num beat" : "num"}>
          {n}
        </b>
      ) : null}
    </span>
  );
}
