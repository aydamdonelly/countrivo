"use client";

import { useEffect, useState } from "react";
import { cardValue } from "@/lib/game-logic/higher-or-lower/stats";
import type { HoLStat } from "@/lib/game-logic/higher-or-lower/stats";

/** 12 changes a second (concept 3.7, `--step-num`). */
const STEP_MS = 83;

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export interface TickProps {
  stat: HoLStat;
  value: number;
  /** The whole count, fixed whatever the value, so its length tells nothing. */
  ms: number;
}

/**
 * The revealed value ticking in from 0 (HL2). Mounted once per reveal. The final figure is
 * in the DOM from the first frame (a hidden sizer holds the width and a screen-reader copy
 * reads it); only the painted copy ticks. Reduced motion prints the final value at once.
 */
export function Tick({ stat, value, ms }: TickProps) {
  const [shown, setShown] = useState<number | null>(() => (reducedMotion() ? null : 0));
  useEffect(() => {
    if (reducedMotion()) return;
    const t0 = performance.now();
    const id = window.setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      if (k >= 1) {
        setShown(null);
        window.clearInterval(id);
        return;
      }
      setShown(value * (1 - Math.pow(1 - k, 3)));
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [value, ms]);
  const final = cardValue(stat, value);
  return (
    <span className="num inline-grid whitespace-nowrap">
      <span className="invisible col-start-1 row-start-1" aria-hidden="true">
        {final}
      </span>
      <span className="col-start-1 row-start-1" aria-hidden="true">
        {shown === null ? final : cardValue(stat, shown)}
      </span>
      <span className="sr-only">{final}</span>
    </span>
  );
}
