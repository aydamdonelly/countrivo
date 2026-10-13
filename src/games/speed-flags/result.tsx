"use client";

import { useEffect, useState } from "react";
import type { SpeedFlagsState } from "@/lib/game-logic/speed-flags/engine";
import type { ResultProps } from "@/games/types";
import { SPEED_SECONDS } from "./module";
import "./board.css";

/** The device best (concept 5.8): a plain first-party cookie, read once and raised after a run. */
const BEST_COOKIE = "cv_sf_best";
const YEAR_SECONDS = 31_536_000;

function readBest(): number | null {
  if (typeof document === "undefined") return null;
  for (const part of document.cookie.split("; ")) {
    if (!part.startsWith(`${BEST_COOKIE}=`)) continue;
    const n = Number(part.slice(BEST_COOKIE.length + 1));
    return Number.isInteger(n) && n >= 0 ? n : null;
  }
  return null;
}

function writeBest(n: number): void {
  try {
    document.cookie = `${BEST_COOKIE}=${n}; Path=/; Max-Age=${YEAR_SECONDS}; SameSite=Lax`;
  } catch {
    // Cookies blocked: the line still shows this run's number.
  }
}

/**
 * Under the score: "right in 30 seconds", then the best on this device. The panel's Erode
 * number is the score itself. A practice run is only ever finished on the client, so the
 * cookie read never meets the server HTML.
 */
export function Result({ state }: ResultProps<SpeedFlagsState>) {
  const [before] = useState<number | null>(readBest);
  const best = Math.max(before ?? 0, state.correct);
  const fresh = before !== null && state.correct > before;

  useEffect(() => {
    if (before === null || state.correct > before) writeBest(state.correct);
  }, [before, state.correct]);

  return (
    <div className="sf-res">
      <p className="t-body">right in {SPEED_SECONDS} seconds</p>
      <p className="best t-meta">{fresh ? "New best on this device" : `Best on this device: ${best}`}</p>
    </div>
  );
}
