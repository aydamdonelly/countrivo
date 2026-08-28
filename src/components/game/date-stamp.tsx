"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const berlinToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });

/**
 * Today's puzzle stamp — DD · MM · YY in Europe/Berlin time.
 * Resolved on the client so statically built landing pages never show a stale build date.
 */
export function DateStamp({ accentClassName = "text-gold mx-0.5" }: { accentClassName?: string }) {
  const berlin = useSyncExternalStore(subscribe, berlinToday, () => null);
  if (!berlin) {
    return (
      <time className="font-mono text-cream-muted text-sm tabular-nums mt-3 inline-flex items-center justify-center opacity-0" aria-hidden>
        00·00·00
      </time>
    );
  }
  const [yyyy, mm, dd] = berlin.split("-");
  const yy = yyyy.slice(2);
  return (
    <time
      dateTime={berlin}
      className="font-mono text-cream-muted text-sm tabular-nums mt-3 inline-flex items-center justify-center"
    >
      {dd}<span className={accentClassName}>·</span>{mm}<span className={accentClassName}>·</span>{yy}
    </time>
  );
}
