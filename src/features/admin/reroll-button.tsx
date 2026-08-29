"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { rerollDailyAction } from "@/app/actions/admin";
import { Button } from "@/ui/button";
import { SectionHead } from "@/ui/section-head";

/**
 * Admin only (blueprint 7.16): re-rolls every daily to a new puzzle and resets the day for
 * everyone. Two steps rather than a browser dialog, because a native shell has no
 * `window.confirm` worth showing. The action bumps the edition tag itself, so the refresh
 * below already reads the new boards.
 */
export function RerollButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reroll() {
    setBusy(true);
    setError(null);
    const res = await rerollDailyAction();
    setBusy(false);
    if (!res.success) {
      setError(res.error === "not_authorized" ? "Not allowed." : "Reroll failed. Try again.");
      return;
    }
    setConfirming(false);
    router.refresh();
  }

  return (
    <section className="sec admin">
      <SectionHead title="Admin" />
      <p className="sub t-body">Rerolls every daily to a new puzzle and resets today for all players.</p>
      <div className="acts">
        {confirming ? (
          <>
            <Button variant="quiet" onClick={() => void reroll()} disabled={busy} pending={busy} pendingLabel="Rerolling">
              Yes, reroll today
            </Button>
            <Button variant="text" onClick={() => setConfirming(false)} disabled={busy}>
              Cancel
            </Button>
          </>
        ) : (
          <Button variant="quiet" onClick={() => setConfirming(true)}>
            Reroll today
          </Button>
        )}
      </div>
      {error ? <p className="err t-meta">{error}</p> : null}
    </section>
  );
}
