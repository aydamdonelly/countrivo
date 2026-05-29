"use client";

import { useState } from "react";
import { rerollDailyAction } from "@/app/actions/admin";
import { getTodayDateKey } from "@/lib/daily-seed";

export function AdminRerollButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (busy) return;
    if (!window.confirm("Reroll every daily game to new puzzles and reset today for all players? Today's runs are deleted.")) {
      return;
    }
    setBusy(true);
    setError(null);
    const res = await rerollDailyAction();
    if (!res.success) {
      setBusy(false);
      setError(res.error ?? "Reroll failed");
      return;
    }
    // Clear this browser's daily completion state so the fresh puzzles show up
    // immediately (lockout/progress keys are edition-scoped and ignored anyway).
    try {
      const today = getTodayDateKey();
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith("countrivo_daily_") && k.includes(today)) {
          localStorage.removeItem(k);
        }
      }
    } catch {
      // ignore
    }
    window.location.reload();
  }

  return (
    <div className="rounded-xl border border-gold/30 bg-gold-dim p-4">
      <p className="text-sm font-bold">Admin</p>
      <p className="text-xs text-cream-muted mt-0.5 mb-3">
        Re-roll every daily game to new puzzles and reset today for all players.
      </p>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="cta-secondary text-sm px-4 py-2 disabled:opacity-50"
      >
        {busy ? "Rerolling…" : "Reroll all dailies"}
      </button>
      {error && <p className="text-xs text-incorrect mt-2">{error}</p>}
    </div>
  );
}
