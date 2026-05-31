"use client";

import { useEffect, useState } from "react";
import { msUntilReset } from "@/lib/daily-seed";

/** Format ms as a zero-padded HH:MM:SS string. */
function formatHMS(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Live HH:MM:SS countdown to the next Berlin-midnight daily reset.
 *
 * Ticks once per second and cleans up its interval on unmount. Returns an empty
 * string until the component has mounted on the client, so server and first
 * client render agree (no hydration mismatch).
 */
export function useResetCountdown(): string {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const tick = () => setLabel(formatHMS(msUntilReset()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return label;
}
