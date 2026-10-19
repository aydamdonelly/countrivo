"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { blockLeaderboardPublisher, reportLeaderboardName, unblockLeaderboardPublishers } from "@/app/actions/anonymous-games";

export function ReportName({ runId, name }: { runId: number; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"report" | "block" | null>(null);
  if (!open) return <button type="button" className="lb-report" aria-label={`Report or block ${name}`} onClick={() => setOpen(true)}><span aria-hidden="true">⋯</span></button>;
  return <form className="lb-report-form" aria-busy={!!pending || undefined} onSubmit={async event => {
    event.preventDefault();
    if (pending || reported) return;
    const reason = new FormData(event.currentTarget).get("reason");
    setPending("report"); setError(null);
    try {
      const result = await reportLeaderboardName(runId, typeof reason === "string" ? reason : "Inappropriate name");
      if (result.success) { setReported(true); setMessage("Report received. You can also block this player."); }
      else setError(result.error ?? "Could not send report. Try again.");
    } catch { setError("Connection lost. Try sending your report again."); }
    finally { setPending(null); }
  }}>
    <p className="lb-report-name t-meta">Report or block <b>{name}</b></p>
    {!reported ? <><label className="sr-only" htmlFor={`report-${runId}`}>Reason for reporting {name}</label>
      <select name="reason" id={`report-${runId}`} disabled={!!pending}><option>Inappropriate name</option><option>Impersonation</option><option>Advertising</option></select>
      <button type="submit" disabled={!!pending}>{pending === "report" ? "Sending…" : "Send report"}</button></> : null}
    <button type="button" disabled={!!pending} onClick={async () => {
      if (pending) return;
      setPending("block"); setError(null);
      try {
        const result = await blockLeaderboardPublisher(runId);
        if (result.success) { setMessage("Player blocked on this browser."); router.refresh(); }
        else setError(result.error ?? "Could not block player. Try again.");
      } catch { setError("Connection lost. Try blocking this player again."); }
      finally { setPending(null); }
    }}>{pending === "block" ? "Blocking…" : "Block player"}</button>
    <button type="button" disabled={!!pending} onClick={() => setOpen(false)}>Close</button>
    {message ? <span className="lb-report-message" role="status">{message}</span> : null}
    {error ? <span className="lb-report-message text-ember" role="alert">{error}</span> : null}
  </form>;
}

export function BlockedPlayersSettings() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return <div className="lb-block-settings"><span className="t-meta text-mute">Blocked players are hidden. Ranks include every published score.</span>
    <button type="button" className="lb-report" disabled={pending} aria-busy={pending || undefined} onClick={async () => {
      setPending(true); setError(null);
      try {
        const result = await unblockLeaderboardPublishers();
        if (result.success) router.refresh();
        else setError(result.error ?? "Could not update blocked players. Try again.");
      } catch { setError("Connection lost. Try again."); }
      finally { setPending(false); }
    }}>{pending ? "Updating…" : "Unblock all players"}</button>
    {error ? <p role="alert" className="t-meta text-ember">{error}</p> : null}
  </div>;
}

export function LeaderboardRetry() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button type="button" className="btn btn-ink" aria-busy={pending || undefined} disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? "Opening board…" : "Try again"}</button>;
}
