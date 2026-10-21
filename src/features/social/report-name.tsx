"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { blockLeaderboardPublisher, reportLeaderboardName, unblockLeaderboardPublishers } from "@/app/actions/anonymous-games";
import "./report-name.css";

export function ReportName({ runId, name, onBlocked }: { runId: number; name: string; onBlocked?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"report" | "block" | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const reasonSelect = useRef<HTMLSelectElement>(null);
  const blockButton = useRef<HTMLButtonElement>(null);
  const panelId = `player-options-${runId}`;
  useEffect(() => {
    if (!open) return;
    (reported ? blockButton.current : reasonSelect.current)?.focus({ preventScroll: true });
  }, [open, reported]);
  function close() {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }
  return <><button ref={trigger} type="button" className="lb-report" aria-label={`Report or block ${name}`} aria-expanded={open} aria-controls={panelId} onClick={() => open ? close() : setOpen(true)}><span aria-hidden="true">⋯</span></button>
  {open ? <form id={panelId} className="lb-report-form" aria-label={`Report or block ${name}`} aria-busy={!!pending || undefined} onKeyDown={event => { if (event.key === "Escape" && !pending) { event.preventDefault(); close(); } }} onSubmit={async event => {
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
      <select ref={reasonSelect} name="reason" id={`report-${runId}`} disabled={!!pending}><option>Inappropriate name</option><option>Impersonation</option><option>Advertising</option></select>
      <button type="submit" disabled={!!pending}>{pending === "report" ? "Sending…" : "Send report"}</button></> : null}
    <button ref={blockButton} type="button" disabled={!!pending} onClick={async () => {
      if (pending) return;
      setPending("block"); setError(null);
      try {
        const result = await blockLeaderboardPublisher(runId);
        if (result.success) {
          const row = trigger.current?.closest(".lb-row, .standing-row");
          const nextControl = row?.nextElementSibling?.querySelector<HTMLElement>("button, a[href]")
            ?? row?.previousElementSibling?.querySelector<HTMLElement>("button, a[href]")
            ?? document.querySelector<HTMLElement>(".lb-view-tabs a[aria-current], main a[href]");
          setMessage("Player blocked on this browser."); close(); onBlocked?.(); nextControl?.focus({ preventScroll: true }); router.refresh();
        }
        else setError(result.error ?? "Could not block player. Try again.");
      } catch { setError("Connection lost. Try blocking this player again."); }
      finally { setPending(null); }
    }}>{pending === "block" ? "Blocking…" : "Block player"}</button>
    <button type="button" disabled={!!pending} onClick={close}>Close</button>
    {message ? <span className="lb-report-message" role="status">{message}</span> : null}
    {error ? <span className="lb-report-message text-ember" role="alert">{error}</span> : null}
  </form> : null}</>;
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
