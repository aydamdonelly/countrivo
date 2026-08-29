"use client";

import { useEffect, useState } from "react";
import { cn, formatStat } from "@/lib/utils";

/** How every frame is printed. A name, not a function, so server components can pass it. */
export type CountUpKind = "int" | "grouped" | "stat";

export interface CountUpProps {
  /** The final value. The server HTML and the first client render print it in full. */
  value: number;
  /** 600 for the result score, 400 for a reveal, 300 for a Draft rank. */
  duration?: number;
  /** int `1280`, grouped `1 280`, stat `formatStat(n, unit)` (`5.5M`, `84.0 years`). */
  kind?: CountUpKind;
  /** The unit for `kind="stat"`. */
  unit?: string;
  /** Plays the count on mount; false renders the value statically. */
  animate?: boolean;
  /** One `num-pop` beat (scale .88 to 1) on mount: the Draft pick landing. */
  pop?: boolean;
  className?: string;
}

/** `1280` as `1 280` (the copy voice spaces its thousands). */
export function groupThousands(n: number): string {
  return Math.round(n).toLocaleString("en-US").replace(/,/g, " ");
}

function print(n: number, kind: CountUpKind, unit: string): string {
  if (kind === "grouped") return groupThousands(n);
  if (kind === "stat") return formatStat(n, unit);
  return String(Math.round(n));
}

/**
 * A number that counts from 0 to its value (blueprint 6.3.2, 6.3.5, 6.3.6). The final value
 * is in the HTML; the count starts on hydration; reduced motion renders it static. A hidden
 * sizer holds the final value so the width never jumps mid-count.
 */
export function CountUp({ value, duration = 600, kind = "int", unit = "", animate = true, pop, className }: CountUpProps) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (!animate || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(value * eased);
      if (k < 1) raf = window.requestAnimationFrame(step);
    };
    raf = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(raf);
  }, [value, duration, animate]);
  return (
    <span className={cn("cu num", pop && "num-pop", className)}>
      <span className="cu-size" aria-hidden="true">
        {print(value, kind, unit)}
      </span>
      <span className="cu-live">{print(shown, kind, unit)}</span>
    </span>
  );
}
