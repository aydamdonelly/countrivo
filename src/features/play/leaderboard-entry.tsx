"use client";

import { useEffect, useRef, useState } from "react";
import { NavigationLink } from "@/ui/navigation-link";
import { useRouter } from "next/navigation";
import { getLeaderboardPlaces, publishAnonymousRun, withdrawLeaderboardName, refreshResultStanding } from "@/app/actions/anonymous-games";
import { rememberedLeaderboardName, rememberLeaderboardName } from "@/lib/leaderboard-name";
import type { ServerGameRun } from "@/types/server";
import { ChevronRightIcon } from "@/ui/icons/chevron-right";
import { CheckIcon } from "@/ui/icons/check";
import { ReportName } from "@/features/social/report-name";
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
  const [confirmation, setConfirmation] = useState(0);
  const [currentRun, setCurrentRun] = useState(run);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState<"publish" | "remove" | "refresh" | null>(null);
  const [blockedRows, setBlockedRows] = useState<number[]>([]);
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
  const ownRow = useRef<HTMLLIElement>(null);

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
    setName(published ?? name); setError(null); setNotice(""); setConfirmation(0); setEditing(true);
    requestAnimationFrame(() => nameInput.current?.focus({ preventScroll: true }));
  }

  async function removeName() {
    if (busy) return;
    setPending("remove"); setError(null); setNotice("");
    try {
      const result = await withdrawLeaderboardName(run.id);
      if (result.success) {
        setPublished(null); setRemoving(false); setEditing(false); setConfirmation(0);
        setNotice("Name removed. Your result is private.");
        if (result.run) { setCurrentRun(result.run); onPublished?.(result.run); }
        if (!onPublished) router.refresh();
        requestAnimationFrame(() => joinButton.current?.focus({ preventScroll: true }));
      } else setError(result.error ?? "Could not remove your name. Try again.");
    } catch { setError("Connection lost. Try removing your name again."); }
    finally { setPending(null); }
  }

  const neighbours = (onBoard ? [] : currentRun.leaderboard?.entries ?? []).filter(entry => !blockedRows.includes(entry.runId));
  const before = neighbours.filter(entry => entry.scoreSortValue > currentRun.scoreSortValue);
  const after = neighbours.filter(entry => entry.scoreSortValue <= currentRun.scoreSortValue);
  const ownRank = currentRun.moderationHidden ? null : published ? currentRun.rankDaily : preview?.rank;
  const publicRow = (entry: NonNullable<ServerGameRun["leaderboard"]>["entries"][number]) => <li className="standing-row" key={entry.runId}>
    <span className="standing-rank num">{entry.rank + (!published && preview && entry.scoreSortValue < currentRun.scoreSortValue ? 1 : 0)}</span><span className="standing-name">{entry.displayName}</span><b className="standing-score num">{entry.scoreDisplay}</b>
    <ReportName runId={entry.runId} name={entry.displayName} onBlocked={() => setBlockedRows(previous => [...previous, entry.runId])} />
  </li>;
  const privateNote = `${id}-note`;

  return <section className={`leaderboard-entry name-entry${published && !editing ? " name-published" : ""}${onBoard ? " name-on-board" : ""}`} aria-labelledby={`${id}-heading`}>
    {!onBoard ? <div className="name-heading">
      {/* eslint-disable-next-line @next/next/no-img-element -- local decorative icon */}
      <img src="/design/leaderboard.svg" alt="" width={20} height={20} />
      <h2 id={`${id}-heading`} className="t-h3">Today’s leaderboard</h2>
      <span className="t-meta text-mute">{published ? "Joined" : "Preview"}</span>
    </div> : <h2 id={`${id}-heading`} className="sr-only">Your leaderboard entry</h2>}
    {!onBoard && currentRun.dailyNameCount !== undefined ? <p className="standing-count t-meta">{currentRun.dailyNameCount} {currentRun.dailyNameCount === 1 ? "published player" : "published players"}{!published ? " · your place below" : ""}</p> : null}
    <ol className="standing-list" aria-label={onBoard ? "Your score" : "Leaderboard around your result"}>
      {before.map(publicRow)}
      {currentRun.leaderboard?.gapBeforeYou && before.length ? <li className="standing-gap t-meta" aria-label="Other places omitted">···</li> : null}
      <li ref={ownRow} className={`standing-you${!published || editing ? " standing-edit" : ""}`} tabIndex={-1}>
        {confirmation > 0 && published && !editing && !currentRun.moderationHidden ? <span key={confirmation} className="standing-confirmation" aria-hidden="true" /> : null}
        {published && !editing ? <>
          <span className="standing-rank num" aria-label={ownRank ? undefined : "Rank unavailable"}>{ownRank ?? "-"}</span>
          <span className="standing-name"><b>{published}</b><small className="standing-you-label">You {currentRun.moderationHidden ? "· name under review" : <CheckIcon key={confirmation} size={14} className={confirmation > 0 ? "standing-confirmed-check" : undefined} />}</small></span>
          <b className="standing-score num">{currentRun.scoreDisplay}</b>
          <span aria-hidden="true" />
        </> : <form onSubmit={async event => {
          event.preventDefault();
          if (busy) return;
          setPending("publish"); setError(null); setNotice("");
          try {
            const result = await publishAnonymousRun(run.id, name, place);
            if (result.success && result.run) {
              const savedName = result.publishedName ?? name.normalize("NFKC").trim().replace(/\s+/g, " ");
              rememberLeaderboardName(savedName);
              setName(savedName); setPublished(savedName); setCurrentRun(result.run); setEditing(false);
              setConfirmation(previous => previous + 1);
              onPublished?.(result.run);
              if (!onPublished) router.refresh();
              requestAnimationFrame(() => ownRow.current?.focus({ preventScroll: true }));
            } else setError(result.error ?? "Could not publish. Try again.");
          } catch { setError("Connection lost. Your result is safe. Try adding your name again."); }
          finally { setPending(null); }
        }}>
          <span className="standing-rank num" aria-label={ownRank ? undefined : "Rank unavailable"}>{ownRank ?? "-"}</span>
          <div className="standing-name-field"><label className="t-meta" htmlFor={id}>Your name on the board</label>
            <input ref={nameInput} id={id} name="displayName" type="text" minLength={2} maxLength={20} required autoComplete="nickname" placeholder="Your name" value={name}
              onChange={event => { touched.current = true; setName(event.target.value); setError(null); }} aria-invalid={invalidName || undefined} aria-describedby={`${privateNote} ${id}-feedback`} disabled={busy} />
          </div>
          <b className="standing-score num">{currentRun.scoreDisplay}</b>
          <button ref={joinButton} className="btn btn-ink t-cta standing-join" type="submit" disabled={busy} aria-busy={pending === "publish" || undefined}>{pending === "publish" ? "Saving name…" : published ? "Save name" : "Put me on the leaderboard"}</button>
          <p id={privateNote} className="t-meta standing-privacy">{published ? "Your current name stays until you save." : "Your score is private until you join."}</p>
        </form>}
      </li>
      {after.map(publicRow)}
    </ol>
    {!published && preview ? <p className="standing-preview t-meta">{preview.playerCount === 1 ? "Be the first today" : `You’d be #${preview.rank} of ${preview.playerCount}`} · equal scores share a place.</p> : published && ranked ? <p className="standing-preview t-meta" role="status">You’re #{currentRun.rankDaily} of {currentRun.dailyNameCount}</p> : null}
    {currentRun.leaderboard?.available === false ? <div className="standing-unavailable t-meta"><span>The leaderboard couldn’t be opened. Your score is saved.</span><button type="button" disabled={busy} onClick={async () => {
      setPending("refresh"); setError(null);
      try { const fresh = await refreshResultStanding(run.id); if (fresh) { setCurrentRun(fresh); onPublished?.(fresh); } else setError("Could not refresh. Try again."); }
      catch { setError("Connection lost. Try again."); } finally { setPending(null); }
    }}>{pending === "refresh" ? "Opening leaderboard…" : "Try again"}</button></div> : null}
    {!published || editing ? <details className="name-country" onToggle={event => { if (event.currentTarget.open) void loadPlaces(); }}><summary className="t-meta">Add a country flag (optional)</summary>
      <label className="sr-only" htmlFor={`${id}-place`}>Country</label><select id={`${id}-place`} value={place} onChange={event => setPlace(event.target.value)} disabled={busy || placesPending} aria-busy={placesPending || undefined}>
        <option value="">{placesPending ? "Opening country list…" : "Keep my country private"}</option>{places.map(country => <option key={country.iso3} value={country.iso3}>{country.name}</option>)}
      </select>{placesFailed ? <button type="button" className="name-cancel t-meta" onClick={() => void loadPlaces()}>Could not open countries. Try again</button> : null}
    </details> : null}
    {published && !editing ? <details className="name-management"><summary className="t-meta">Manage my entry</summary><div className="name-small-actions">
      <button ref={changeButton} type="button" onClick={editName} disabled={busy}>Change name</button>
      <button ref={removeButton} type="button" disabled={busy} aria-expanded={removing} aria-controls={`${id}-remove`} onClick={() => { setError(null); setRemoving(true); }}>Remove my name</button>
    </div>{removing ? <div id={`${id}-remove`} className="name-remove-confirm"><p className="t-body">Remove your public name? Your result stays saved.</p><div className="name-small-actions">
      <button type="button" disabled={busy} onClick={() => void removeName()}>{pending === "remove" ? "Removing…" : "Remove name"}</button>
      <button type="button" disabled={busy} onClick={() => { setRemoving(false); requestAnimationFrame(() => removeButton.current?.focus({ preventScroll: true })); }}>Keep it</button>
    </div></div> : null}</details> : null}
    {published && editing ? <button type="button" className="name-cancel t-meta" disabled={busy} onClick={() => { setEditing(false); setError(null); requestAnimationFrame(() => ownRow.current?.focus({ preventScroll: true })); }}>Cancel</button> : null}
    <p id={`${id}-feedback`} className="name-feedback t-meta" role={error ? "alert" : "status"}>{error ?? notice}</p>
    {!onBoard ? <NavigationLink ref={boardLink} prefetch pendingLabel="Opening leaderboard…" className="standing-full t-meta" href={`${boardHref}#leaderboard-your-score`}>Full leaderboard<ChevronRightIcon size={16} /></NavigationLink> : null}
  </section>;
}
