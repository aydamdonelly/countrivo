"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getLeaderboardPlaces, publishAnonymousRun, withdrawLeaderboardName } from "@/app/actions/anonymous-games";
import type { ServerGameRun } from "@/types/server";
import { Button } from "@/ui/button";
import "@/ui/result-panel.css";

export interface LeaderboardEntryProps {
  run: ServerGameRun;
  publishedName?: string | null;
  onPublished?: (run: ServerGameRun) => void;
}

export function LeaderboardEntryForm({ run, publishedName, onPublished }: LeaderboardEntryProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(publishedName ?? "");
  const [published, setPublished] = useState(publishedName ?? null);
  const [currentRun, setCurrentRun] = useState(run);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [places, setPlaces] = useState<{ iso3: string; name: string }[]>([]);
  const [place, setPlace] = useState(run.placeCountry ?? "");
  const [placesPending, setPlacesPending] = useState(false);
  const [placesFailed, setPlacesFailed] = useState(false);
  if (run.mode !== "daily") return null;

  async function loadPlaces() {
    if (places.length || placesPending) return;
    setPlacesPending(true);
    setPlacesFailed(false);
    try { setPlaces(await getLeaderboardPlaces()); }
    catch { setPlacesFailed(true); }
    finally { setPlacesPending(false); }
  }

  function openForm() {
    setName(published ?? name);
    setError(null);
    setOpen(true);
    void loadPlaces();
  }

  const boardHref = `/games/${run.gameSlug}/leaderboard${run.dailyDate ? `?date=${run.dailyDate}` : ""}`;
  if (published && !open) return <div className="name-published" aria-busy={pending || undefined}>
    <p className="t-body" role="status">{currentRun.moderationHidden ? "Your name is hidden while we review a report: " : currentRun.rankDaily && currentRun.dailyNameCount
      ? `You’re #${currentRun.rankDaily} of ${currentRun.dailyNameCount} today as ` : "You’re on the board as "}<b>{published}</b>.</p>
    <Link className="name-board-link" href={boardHref}>See your place</Link>
    <div className="name-small-actions"><button type="button" onClick={openForm}>Change name</button>
      <button type="button" disabled={pending} onClick={() => { setError(null); setRemoving(true); }}>Remove my name</button></div>
    {removing ? <div className="name-remove-confirm"><p className="t-body">Remove your public name? Your result stays saved.</p><div className="name-small-actions">
      <button type="button" disabled={pending} onClick={async () => {
        if (pending) return;
        setPending(true); setError(null);
        try {
          const result = await withdrawLeaderboardName(run.id);
          if (result.success) { setPublished(null); setRemoving(false); router.refresh(); }
          else setError(result.error ?? "Could not remove your name. Try again.");
        } catch { setError("Connection lost. Try removing your name again."); }
        finally { setPending(false); }
      }}>{pending ? "Removing…" : "Remove name"}</button><button type="button" disabled={pending} onClick={() => setRemoving(false)}>Keep it</button>
    </div></div> : null}
    {error ? <p role="alert" className="t-meta text-ember">{error}</p> : null}
  </div>;

  return <div className="name-entry">
    {!open ? <Button variant="ink" onClick={openForm}>Put me on the leaderboard</Button> : <form aria-busy={pending || undefined} onSubmit={async event => {
      event.preventDefault();
      if (pending) return;
      setPending(true); setError(null);
      try {
        const result = await publishAnonymousRun(run.id, name, place);
        if (result.success && result.run) {
          setPublished(result.publishedName ?? name.trim());
          setCurrentRun(result.run);
          setOpen(false);
          onPublished?.(result.run);
          // The result host already has the server-confirmed rank; refreshing it would fetch every game again.
          if (!onPublished) router.refresh();
        } else setError(result.error ?? "Could not publish. Try again.");
      } catch { setError("Connection lost. Your result is safe. Try adding your name again."); }
      finally { setPending(false); }
    }}>
      <label className="t-body" htmlFor={`leaderboard-name-${run.id}`}>Your name on the board</label>
      <div className="name-controls">
        <input id={`leaderboard-name-${run.id}`} name="displayName" type="text" minLength={2} maxLength={20} required autoComplete="nickname" autoFocus
          placeholder="Your name" value={name} onChange={event => setName(event.target.value)} aria-describedby={`leaderboard-note-${run.id}`} disabled={pending} />
        <Button variant="ink" type="submit" disabled={pending} pending={pending} pendingLabel="Saving name…">{published ? "Save name" : "Add my name"}</Button>
      </div>
      <details className="name-country"><summary className="t-meta">Add a country flag (optional)</summary>
        <label className="sr-only" htmlFor={`leaderboard-place-${run.id}`}>Country</label>
        <select id={`leaderboard-place-${run.id}`} value={place} onChange={event => setPlace(event.target.value)} disabled={pending || placesPending} aria-busy={placesPending || undefined}>
          <option value="">{placesPending ? "Opening country list…" : "Keep my country private"}</option>{places.map(country => <option key={country.iso3} value={country.iso3}>{country.name}</option>)}
        </select>
        {placesFailed ? <button type="button" className="name-cancel t-meta" onClick={() => void loadPlaces()}>Could not open countries. Try again</button> : null}
      </details>
      <p id={`leaderboard-note-${run.id}`} className="t-meta text-mute">Name and score are public. No account.</p>
      {error ? <p className="t-meta text-ember" role="alert">{error}</p> : null}
      <button type="button" className="name-cancel t-meta" onClick={() => setOpen(false)} disabled={pending}>{published ? "Cancel" : "Keep my result private"}</button>
    </form>}
  </div>;
}
