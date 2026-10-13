"use client";

import { useState } from "react";
import { reportLeaderboardName } from "@/app/actions/anonymous-games";

export function ReportName({ runId, name }: { runId: number; name: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  if (message) return <span className="t-meta" role="status">{message}</span>;
  if (!open) return <button type="button" className="lb-report" aria-label={`Report the name ${name}`} onClick={() => setOpen(true)}>Report</button>;
  return <form className="lb-report-form" onSubmit={async (event) => {
    event.preventDefault(); setPending(true);
    const form = new FormData(event.currentTarget);
    const reason = form.get("reason");
    const result = await reportLeaderboardName(runId, typeof reason === "string" ? reason : "Inappropriate name");
    setPending(false); setMessage(result.success ? "Report received" : result.error ?? "Try again");
  }}>
    <label className="sr-only" htmlFor={`report-${runId}`}>Reason for reporting {name}</label>
    <select name="reason" id={`report-${runId}`}><option>Inappropriate name</option><option>Impersonation</option><option>Advertising</option></select>
    <button type="submit" disabled={pending}>Send report</button><button type="button" onClick={() => setOpen(false)}>Cancel</button>
  </form>;
}
