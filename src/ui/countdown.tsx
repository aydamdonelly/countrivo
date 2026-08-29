"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface CountdownProps {
  /** Epoch ms of the next Europe/Berlin midnight, from getClock(). */
  resetAt: number;
  /** Date.now() on the server, from getClock(). */
  serverNow: number;
  label?: "resets in" | "next board in";
  className?: string;
}

/** `17 h 37 m`; under one hour `41 m`; under one minute `now`. */
export function formatCountdown(ms: number): string {
  if (ms < 60_000) return "now";
  const totalMin = Math.floor(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h === 0 ? `${m} m` : `${h} h ${m} m`;
}

/**
 * `resets in <b>17 h 37 m</b>` (blueprint 3.2). The first render prints the string
 * derived from the props, identical on the server and the client; after mount a 30 s
 * interval re-derives from the server clock plus the time elapsed since mount. Never
 * renders empty.
 */
export function Countdown({ resetAt, serverNow, label = "resets in", className }: CountdownProps) {
  const [text, setText] = useState(() => formatCountdown(resetAt - serverNow));
  useEffect(() => {
    const clientNowAtMount = Date.now();
    const tick = () => setText(formatCountdown(resetAt - (Date.now() + (serverNow - clientNowAtMount))));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [resetAt, serverNow]);
  return (
    <span className={cn("cd t-meta", className)}>
      {label}
      <b className="num" suppressHydrationWarning>
        {text}
      </b>
    </span>
  );
}
