"use client";

import { useEffect, useRef, useState } from "react";
import { NavigationLink } from "@/ui/navigation-link";
import { useRouter } from "next/navigation";
import { getLeaderboardPlaces, publishAnonymousRun, withdrawLeaderboardName } from "@/app/actions/anonymous-games";
import { rememberedLeaderboardName, rememberLeaderboardName } from "@/lib/leaderboard-name";
import type { ServerGameRun } from "@/types/server";
import { CheckIcon } from "@/ui/icons/check";
import "./leaderboard-entry.css";

export interface LeaderboardEntryProps {
  run: ServerGameRun;
  publishedName?: string | null;
  onPublished?: (run: ServerGameRun) => void;
  onBoard?: boolean;
}

export function LeaderboardEntryForm(props: LeaderboardEntryProps) {
  return props.run.mode === "daily" ? <Entry key={props.run.id} {...props} /> : null;
}

function Entry({ run, publishedName, onPublished, onBoard = false }: LeaderboardEntryProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(publishedName ?? "");
  const [published, setPublished] = useState(publishedName ?? null);
  const [currentRun, setCurrentRun] = useState(run);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState<"publish" | "remove" | null>(null);
  const [removing, setRemoving] = useState(false);
  const [places, setPlaces] = useState<{ iso3: string; name: string }[]>([]);
  const [place, setPlace] = useState(run.placeCountry ?? "");
  const [placesPending, setPlacesPending] = useState(false);
  const [placesFailed, setPlacesFailed] = useState(false);
  const touched = useRef(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const joinButton = useRef<HTMLButtonElement>(null);
  const changeButton = useRef<HTMLButtonElement>(null);
  const removeButton = useRef<HTMLButtonElement>(null);
  const boardLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const remembered = rememberedLeaderboardName();
    if (publishedName && !remembered) rememberLeaderboardName(publishedName);
    else if (!publishedName && !touched.current) setName(previous => previous || remembered);
  }, [publishedName, run.id]);

  const id = `leaderboard-name-${run.id}`;
  const boardHref = `/games/${run.gameSlug}/leaderboard${run.dailyDate ? `?date=${run.dailyDate}` : ""}`;
  const busy = pending !== null;
  const preview = currentRun.moderationHidden ? undefined : currentRun.rankPreview;
  const ranked = currentRun.rankDaily && currentRun.dailyNameCount;
  const invalidName = !!error && /letters|different name/.test(error);

  async function loadPlaces() {
    if (places.length || placesPending) return;
    setPlacesPending(true); setPlacesFailed(false);
    try { setPlaces(await getLeaderboardPlaces()); }
    catch { setPlacesFailed(true); }
    finally { setPlacesPending(false); }
  }

  function editName() {
    setName(published ?? name); setError(null); setNotice(""); setEditing(true);
    requestAnimationFrame(() => nameInput.current?.focus({ preventScroll: true }));
  }

  async function removeName() {
    if (busy) return;
    setPending("remove"); setError(null); setNotice("");
    try {
      const result = await withdrawLeaderboardName(run.id);
      if (result.success) {
        setPublished(null); setRemoving(false); setEditing(false);
        setNotice("Name removed. Your result is private.");
        if (result.run) { setCurrentRun(result.run); onPublished?.(result.run); }
        if (!onPublished) router.refresh();
        requestAnimationFrame(() => joinButton.current?.focus({ preventScroll: true }));
      } else setError(result.error ?? "Could not remove your name. Try again.");
    } catch { setError("Connection lost. Try removing your name again."); }
    finally { setPending(null); }
  }

  return <section className={`leaderboard-entry name-entry${published && !editing ? " name-published" : ""}`} aria-labelledby={`${id}-heading`} aria-busy={busy || undefined}>
    <div className="name-heading">
      {/* eslint-disable-next-line @next/next/no-img-element -- small local decorative SVG */}
      <img src="/design/leaderboard.svg" alt="" width={24} height={24} />
      <h2 id={`${id}-heading`} className="t-h3">{published && !editing ? onBoard ? "Your place" : "Leaderboard" : "Join today’s leaderboard"}</h2>
      {published && !editing && !currentRun.moderationHidden ? <CheckIcon size={20} /> : null}
    </div>
    {published && !editing ? <>
      <div className="name-standing" role="status">
        <p className="t-h3">{currentRun.moderationHidden ? "Name under review" : ranked ? `You’re #${currentRun.rankDaily} of ${currentRun.dailyNameCount}` : "You’re on the board"}</p>
        <p className="t-body">{published}</p>
      </div>
      {!currentRun.moderationHidden ? <NavigationLink ref={boardLink} prefetch={!onBoard} pendingLabel="Opening leaderboard…" className="btn btn-ink t-cta name-board-link" href={onBoard ? "#leaderboard-your-score" : boardHref}>{onBoard ? "Jump to your score" : "See your place"}</NavigationLink> : null}
      <div className="name-small-actions"><button ref={changeButton} type="button" onClick={editName} disabled={busy}>Change name</button>
        <button ref={removeButton} type="button" disabled={busy} aria-expanded={removing} aria-controls={`${id}-remove`} onClick={() => { setError(null); setRemoving(true); }}>Remove my name</button></div>
      {removing ? <div id={`${id}-remove`} className="name-remove-confirm"><p className="t-body">Remove your public name? Your result stays saved.</p><div className="name-small-actions">
        <button type="button" disabled={busy} onClick={() => void removeName()}>{pending === "remove" ? "Removing…" : "Remove name"}</button>
        <button type="button" disabled={busy} onClick={() => { setRemoving(false); requestAnimationFrame(() => removeButton.current?.focus({ preventScroll: true })); }}>Keep it</button>
      </div></div> : null}
      <p className="name-feedback t-meta" role={error ? "alert" : "status"}>{error ?? ""}</p>
    </> : <>
      <div className="name-standing">
        <p className="t-h3">{published ? "Change your name" : currentRun.moderationHidden ? "Name under review" : preview ? preview.playerCount === 1 ? "Be the first today" : `You’d be #${preview.rank} of ${preview.playerCount}` : "Join today’s board"}</p>
        <p className="t-meta text-mute">{published ? "Your current name stays until you save." : preview && preview.playerCount > 1 ? "Preview · not published. Equal scores share a place." : "Your result stays private until you join."}</p>
      </div>
      <form aria-busy={busy || undefined} onSubmit={async event => {
        event.preventDefault();
        if (busy) return;
        setPending("publish"); setError(null); setNotice("");
        try {
          const result = await publishAnonymousRun(run.id, name, place);
          if (result.success && result.run) {
            const savedName = result.publishedName ?? name.normalize("NFKC").trim().replace(/\s+/g, " ");
            rememberLeaderboardName(savedName);
            setName(savedName); setPublished(savedName); setCurrentRun(result.run); setEditing(false);
            onPublished?.(result.run);
            if (!onPublished) router.refresh();
            requestAnimationFrame(() => boardLink.current?.focus({ preventScroll: true }));
          } else setError(result.error ?? "Could not publish. Try again.");
        } catch { setError("Connection lost. Your result is safe. Try adding your name again."); }
        finally { setPending(null); }
      }}>
        <label className="t-body" htmlFor={id}>Your name on the board</label>
        <div className="name-controls">
          <input ref={nameInput} id={id} name="displayName" type="text" minLength={2} maxLength={20} required autoComplete="nickname" placeholder="Your name" value={name}
            onChange={event => { touched.current = true; setName(event.target.value); setError(null); }} aria-invalid={invalidName || undefined} aria-describedby={`${id}-note ${id}-feedback`} disabled={busy} />
          <button ref={joinButton} className="btn btn-ink t-cta" type="submit" disabled={busy} aria-busy={pending === "publish" || undefined}>{pending === "publish" ? "Saving name…" : published ? "Save name" : "Put me on the leaderboard"}</button>
        </div>
        <details className="name-country" onToggle={event => { if (event.currentTarget.open) void loadPlaces(); }}><summary className="t-meta">Add a country flag (optional)</summary>
          <label className="sr-only" htmlFor={`${id}-place`}>Country</label>
          <select id={`${id}-place`} value={place} onChange={event => setPlace(event.target.value)} disabled={busy || placesPending} aria-busy={placesPending || undefined}>
            <option value="">{placesPending ? "Opening country list…" : "Keep my country private"}</option>{places.map(country => <option key={country.iso3} value={country.iso3}>{country.name}</option>)}
          </select>
          {placesFailed ? <button type="button" className="name-cancel t-meta" onClick={() => void loadPlaces()}>Could not open countries. Try again</button> : null}
        </details>
        <p id={`${id}-note`} className="t-meta text-mute">Name and score are public. No account.</p>
        <p id={`${id}-feedback`} className="name-feedback t-meta" role={error ? "alert" : "status"}>{error ?? notice}</p>
        {published ? <button type="button" className="name-cancel t-meta" disabled={busy} onClick={() => { setEditing(false); setError(null); requestAnimationFrame(() => changeButton.current?.focus({ preventScroll: true })); }}>Cancel</button> : null}
      </form>
    </>}
  </section>;
}
