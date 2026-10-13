"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getLeaderboardPlaces, publishAnonymousRun, withdrawLeaderboardName } from "@/app/actions/anonymous-games";
import type { ServerGameRun } from "@/types/server";
import { Button } from "@/ui/button";

export interface LeaderboardEntryProps {
  run: ServerGameRun;
  publishedName?: string | null;
  onPublished?: (run: ServerGameRun) => void;
}

export function LeaderboardEntryForm({ run, publishedName, onPublished }: LeaderboardEntryProps) {
  const router=useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [published, setPublished] = useState(publishedName ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [places,setPlaces]=useState<{iso3:string;name:string}[]>([]);
  const [place,setPlace]=useState(run.placeCountry??"");
  if (run.mode !== "daily") return null;
  if (published && !open) return <div className="name-published"><p className="t-body">{run.moderationHidden ? 'This name is hidden while we review a report: ' : run.rankDaily&&run.dailyNameCount?`You’re #${run.rankDaily} of ${run.dailyNameCount} ${run.dailyNameCount===1?'name':'names'} today as `:'You’re on the board as '}<b>{published}</b>. <Link href={`/games/${run.gameSlug}/leaderboard`}>See the leaderboard</Link></p>
    <div className="name-small-actions"><button type="button" onClick={() => { setName(published);setPlace(run.placeCountry??place);setOpen(true);void getLeaderboardPlaces().then(setPlaces); }}>Change name</button>
      <button type="button" disabled={pending} onClick={() => setRemoving(true)}>Remove my name</button></div>
    {removing ? <div className="name-remove-confirm"><p className="t-body">Take your name off today’s leaderboard?</p><div className="name-small-actions"><button type="button" disabled={pending} onClick={async () => { setPending(true); const result = await withdrawLeaderboardName(run.id); setPending(false); if (result.success) {setPublished(null);setRemoving(false);router.refresh();} else setError(result.error ?? "Try again."); }}>Take it off</button><button type="button" disabled={pending} onClick={() => setRemoving(false)}>Keep it</button></div></div> : null}
    {error ? <p role="alert" className="t-meta text-ember">{error}</p> : null}</div>;
  return (
    <div className="name-entry">
      {!open ? <Button variant="ink" onClick={() => { setOpen(true); void getLeaderboardPlaces().then(setPlaces); }}>Put me on the leaderboard</Button> : (
        <form onSubmit={async (event) => {
          event.preventDefault();
          if (pending) return;
          setPending(true);
          setError(null);
          const result = await publishAnonymousRun(run.id, name, place);
          setPending(false);
          if (result.success && result.run) {
            setPublished(result.publishedName ?? name.trim());
            setOpen(false);
            onPublished?.(result.run);
            router.refresh();
          } else setError(result.error ?? "Could not publish. Try again.");
        }}>
          <label className="t-body" htmlFor={`leaderboard-name-${run.id}`}>What should we call you?</label>
          <div className="name-controls">
            <input id={`leaderboard-name-${run.id}`} name="displayName" type="text" minLength={2} maxLength={20} required autoComplete="nickname" autoFocus
              placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} aria-describedby={`leaderboard-note-${run.id}`} disabled={pending} />
            <Button variant="ink" type="submit" disabled={pending}>{pending ? "Adding your name…" : "Add my name"}</Button>
          </div>
          <label className="t-meta" htmlFor={`leaderboard-place-${run.id}`}>Country (optional)</label>
          <select id={`leaderboard-place-${run.id}`} value={place} onChange={(event)=>setPlace(event.target.value)} disabled={pending}>
            <option value="">Keep my place private</option>{places.map(p=><option key={p.iso3} value={p.iso3}>{p.name}</option>)}
          </select>
          <p id={`leaderboard-note-${run.id}`} className="t-meta">Your name and score will be public. No account needed.</p>
          {error ? <p className="t-meta text-ember" role="alert">{error}</p> : null}
          <button type="button" className="name-cancel t-meta" onClick={() => setOpen(false)} disabled={pending}>Keep my result private</button>
        </form>
      )}
    </div>
  );
}
