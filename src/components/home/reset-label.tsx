"use client";

import { useEffect, useState } from "react";
import { msUntilReset } from "@/lib/daily-seed";

function fmt(ms: number) {
  const totalMin = Math.max(0, Math.ceil(ms / 60000));
  const h = Math.floor(totalMin / 60), m = totalMin % 60;
  return h > 0 ? `${h} h ${String(m).padStart(2, "0")} m` : `${m} m`;
}

/** "resets in 17 h 37 m", ticking once a minute. Empty until mounted (no hydration mismatch). */
export function ResetLabel({ className = "" }: { className?: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const tick = () => setLabel(fmt(msUntilReset()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className={`text-xs text-cream-muted whitespace-nowrap ${className}`} aria-live="off">
      {label ? <>resets in <b className="text-cream font-semibold tabular-nums">{label}</b></> : <span className="inline-block w-[92px]">&nbsp;</span>}
    </span>
  );
}
