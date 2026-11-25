"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { blockLeaderboardPublisher, reportLeaderboardName, unblockLeaderboardPublishers } from "@/app/actions/anonymous-games";
import "./report-name.css";

export function ReportName({ runId, name, onBlocked }: { runId: number; name: string; onBlocked?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"report" | "block" | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const confirmButton = useRef<HTMLButtonElement>(null);
  const blockButton = useRef<HTMLButtonElement>(null);
  const panelId = `player-options-${runId}`;
  useEffect(() => {
    if (!open) return;
    (confirm ? confirmButton.current : reported ? blockButton.current : form.current)?.focus({ preventScroll: true });
  }, [open, confirm, reported]);
  function close() {
    setOpen(false);
    setConfirm(false);
    setError(null);
    trigger.current?.focus({ preventScroll: true });
  }
  return <><button ref={trigger} type="button" className="lb-report" disabled={!!pending} aria-label={`Report or block ${name}`} aria-expanded={open} aria-controls={panelId} onClick={() => open ? close() : setOpen(true)}><span aria-hidden="true">⋯</span></button>
  {open ? <form ref={form} id={panelId} className="lb-report-form" data-confirm={confirm || undefined} tabIndex={-1} aria-label={`Report or block ${name}`} aria-busy={!!pending || undefined} onKeyDown={event => { if (event.key === "Escape" && !pending) { event.preventDefault(); event.stopPropagation(); close(); } }} onSubmit={async event => {
    event.preventDefault();
    if (pending || reported || confirm) return;
    const reason = new FormData(event.currentTarget).get("reason");
    setPending("report"); setError(null);
    try {
      const result = await reportLeaderboardName(runId, typeof reason === "string" ? reason : "Inappropriate name");
      if (result.success) { setReported(true); setMessage("Report received. You can also block this player."); }
      else setError(result.error ?? "Could not send report. Try again.");
    } catch { setError("Connection lost. Try sending your report again."); }
    finally { setPending(null); }
  }}>
    {confirm ? <p className="lb-report-name">Hide <b>{name}</b>’s feedback and leaderboard entries on this device?</p> : <p className="lb-report-name">Report or block <b>{name}</b></p>}
    {!confirm && !reported ? <><label htmlFor={`report-${runId}`}>Reason for reporting</label>
      <select name="reason" id={`report-${runId}`} disabled={!!pending}><option>Inappropriate name</option><option>Impersonation</option><option>Advertising</option></select>
      <button className="lb-report-primary" type="submit" disabled={!!pending}>{pending === "report" ? "Sending…" : "Send report"}</button></> : null}
    {confirm ? <button ref={confirmButton} className="lb-report-primary" type="button" disabled={!!pending} onClick={async () => {
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
    }}>{pending === "block" ? "Blocking…" : "Confirm block player"}</button> : <button ref={blockButton} type="button" disabled={!!pending} onClick={() => { setError(null); setConfirm(true); }}>Block player</button>}
    <button className="lb-report-cancel" type="button" disabled={!!pending} onClick={close}>Cancel</button>
    {message && !confirm ? <span className="lb-report-message" role="status">{message}</span> : null}
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
