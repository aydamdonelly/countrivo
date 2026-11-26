"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { publishAnonymousRun, withdrawLeaderboardName, refreshResultStanding } from "@/app/actions/anonymous-games";
import { flagPlaceByIso3 } from "@/lib/data/flag-places";
import { rememberedLeaderboardFlag, rememberedLeaderboardName, rememberLeaderboardFlag, rememberLeaderboardName } from "@/lib/leaderboard-name";
import type { FlagPlace } from "@/types/country";
import type { ServerGameRun } from "@/types/server";
import { CountryPicker, deviceCountry } from "@/ui/country-picker";
import { Flag } from "@/ui/flag";
import { CheckIcon } from "@/ui/icons/check";
import { ChevronDownIcon } from "@/ui/icons/chevron-down";
import { GlobeIcon } from "@/ui/icons/globe";
import { PlayerFlag } from "@/ui/player-flag";
import { RankMarker } from "@/ui/rank-marker";
import { ReportName } from "@/features/social/report-name";
import "./leaderboard-entry.css";

export interface LeaderboardEntryProps {
  run: ServerGameRun;
  publishedName?: string | null;
  onPublished?: (run: ServerGameRun) => void;
  onBoard?: boolean;
}

export function LeaderboardEntryForm(props: LeaderboardEntryProps) {
  return <Entry key={props.run.id} {...props} publishedName={props.publishedName ?? props.run.displayName} />;
}

/**
 * Today's leaderboard on a result (design pass 25 November 2026, section 4): neutral rows,
 * clay medals for places 1 to 3, your row tinted ember with a "You" marker. The join panel sits
 * above the list (26 November 2026) so it is never buried under a long board, and your own row
 * mirrors the name and flag while you type, so you see yourself on the board before saving.
 */
function Entry({ run, publishedName, onPublished, onBoard = false }: LeaderboardEntryProps) {
  const router = useRouter();
  const daily = run.mode === "daily";
  const guest = !publishedName || publishedName.startsWith("guest-");
  const [editing, setEditing] = useState(guest);
  const [name, setName] = useState(guest ? "" : publishedName ?? "");
  const [published, setPublished] = useState(publishedName ?? null);
  const [confirmation, setConfirmation] = useState(0);
  const [currentRun, setCurrentRun] = useState(run);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState<"publish" | "remove" | "refresh" | null>(null);
  const [blockedRows, setBlockedRows] = useState<number[]>([]);
  const [removing, setRemoving] = useState(false);
  const [place, setPlace] = useState(run.placeCountry ?? "");
  const [picking, setPicking] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [lastFlag, setLastFlag] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<FlagPlace | null>(null);
  const touched = useRef(false);
  const placeTouched = useRef(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const joinButton = useRef<HTMLButtonElement>(null);
  const changeButton = useRef<HTMLButtonElement>(null);
  const removeButton = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const ownRow = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const remembered = rememberedLeaderboardName();
    if (publishedName && !guest && !remembered) rememberLeaderboardName(publishedName);
    else if (guest && !touched.current) setName(previous => previous || remembered);
  }, [publishedName, run.id, guest]);

  // A long board opens scrolled to your row, inside the list only: the page itself never jumps.
  const rowCount = currentRun.leaderboard?.entries.length ?? 0;
  useEffect(() => {
    const box = list.current, own = ownRow.current;
    if (!box || !own || box.scrollHeight <= box.clientHeight) return;
    // A pinned row reports its pinned offset, so measure from the row above it.
    const above = own.previousElementSibling;
    const top = above instanceof HTMLElement ? above.offsetTop + above.offsetHeight : 0;
    box.scrollTop = Math.max(0, top - (box.clientHeight - own.offsetHeight) / 2);
  }, [rowCount, currentRun.rankDaily, currentRun.rankPreview?.rank]);

  // The last explicit flag choice fills the button; the device region is only offered, never set.
  useEffect(() => {
    if (!daily) return;
    const remembered = rememberedLeaderboardFlag();
    if (remembered && remembered !== "private") {
      setLastFlag(remembered);
      if (guest && !run.placeCountry && !placeTouched.current) setPlace(previous => previous || remembered);
    }
    if (!remembered) setSuggestion(deviceCountry());
  }, [daily, guest, run.placeCountry]);

  const id = `leaderboard-name-${run.id}`;
  const busy = pending !== null;
  const preview = currentRun.moderationHidden ? undefined : currentRun.rankPreview;
  const invalidName = !!error && /letters|different name/.test(error);
  const chosen = flagPlaceByIso3(place);

  function editName() {
    setName(published?.startsWith("guest-") ? "" : published ?? name); setPlace(currentRun.placeCountry ?? ""); setError(null); setNotice(""); setConfirmation(0); setRemoving(false); setEditing(true); setRenaming(true);
    requestAnimationFrame(() => nameInput.current?.focus({ preventScroll: true }));
  }

  function choosePlace(iso3: string) {
    placeTouched.current = true;
    setPlace(iso3); setError(null);
  }

  async function removeName() {
    if (busy) return;
    setPending("remove"); setError(null); setNotice("");
    try {
      const result = await withdrawLeaderboardName(run.id);
      if (result.success) {
        setPublished(result.run?.displayName ?? null); setName(""); setRemoving(false); setEditing(true); setRenaming(false); setConfirmation(0);
        setNotice("Name removed. Your score is saved under a guest name.");
        if (result.run) { setCurrentRun(result.run); setPlace(result.run.placeCountry ?? ""); onPublished?.(result.run); }
        if (!onPublished) router.refresh();
        requestAnimationFrame(() => joinButton.current?.focus({ preventScroll: true }));
      } else setError(result.error ?? "Could not remove your name. Try again.");
    } catch { setError("Connection lost. Try removing your name again."); }
    finally { setPending(null); }
  }

  const neighbours = (!daily || onBoard ? [] : currentRun.leaderboard?.entries ?? []).filter(entry => !blockedRows.includes(entry.runId));
  const before = neighbours.filter(entry => entry.scoreSortValue > currentRun.scoreSortValue);
  const after = neighbours.filter(entry => entry.scoreSortValue <= currentRun.scoreSortValue);
  const ownRank = currentRun.moderationHidden ? null : published ? currentRun.rankDaily : preview?.rank;
  const publicRow = (entry: NonNullable<ServerGameRun["leaderboard"]>["entries"][number]) => {
    const rank = entry.rank + (!published && preview && entry.scoreSortValue < currentRun.scoreSortValue ? 1 : 0);
    const row = <li className="standing-row" key={entry.runId}>
      <RankMarker className="standing-rank" rank={rank} />
      <span className="standing-name"><PlayerFlag iso2={entry.countryCode} className="standing-flag" /><span className="standing-label">{entry.displayName}</span></span>
      <b className="standing-score num">{entry.scoreDisplay}</b>
      <ReportName runId={entry.runId} name={entry.displayName} onBlocked={() => setBlockedRows(previous => [...previous, entry.runId])} />
    </li>;
    return entry.gapBefore ? [<li className="standing-gap" key={`gap-${entry.runId}`} aria-label="Other places omitted"><span aria-hidden="true">···</span></li>, row] : [row];
  };
  const longList = neighbours.length >= 7;
  const privateNote = `${id}-note`;
  const shownFlag = published && !editing ? flagPlaceByIso3(currentRun.placeCountry)?.iso2 : chosen?.iso2;
  const onPublicBoard = !!published && !currentRun.moderationHidden;
  const count = currentRun.dailyNameCount;
  const empty = daily && currentRun.leaderboard?.available !== false && !neighbours.length && !onBoard && (count ?? 0) === 0;
  const typed = name.normalize("NFKC").trim().replace(/\s+/g, " ");
  const draftName = editing ? typed || (onPublicName(published) ? published : "") : "";
  const ownName = editing ? draftName : published;
  const ownSub = currentRun.moderationHidden ? "Name under review"
    : editing && daily ? (!draftName ? "Add your name above" : draftName !== published ? "Not saved yet, tap Save" : null)
    : !published && daily ? "Not on the public board yet" : null;
  function onPublicName(value: string | null): value is string { return !!value && !value.startsWith("guest-"); }
  const focusName = () => nameInput.current?.focus({ preventScroll: true });

  const controls = <>
    {editing ? <div className={`join-panel${onBoard ? "" : " join-top"}`}>
      <h3 className="join-title">{daily ? "Put your name on the board" : "Add your name"}</h3>
      <p id={privateNote} className="join-note">{published?.startsWith("guest-") ? `Optional. Saved automatically as ${published}.` : daily ? "Optional. Your row below shows how it will look." : "Optional. Leave blank for a guest name."}</p>
      <form className={`join-row${daily ? "" : " join-row-plain"}`} onSubmit={async event => {
        event.preventDefault();
        if (busy) return;
        setPending("publish"); setError(null); setNotice("");
        try {
          const result = await publishAnonymousRun(run.id, name, place);
          if (result.success && result.run) {
            const savedName = result.publishedName ?? name.normalize("NFKC").trim().replace(/\s+/g, " ");
            if (!savedName.startsWith("guest-")) rememberLeaderboardName(savedName);
            if (daily && placeTouched.current) { rememberLeaderboardFlag(place); setLastFlag(place || null); }
            setName(savedName); setPublished(savedName); setCurrentRun(result.run); setEditing(false); setRenaming(false);
            setConfirmation(previous => previous + 1);
            if (daily && result.run.rankDaily && result.run.dailyNameCount) setNotice(`Saved. You’re #${result.run.rankDaily} of ${result.run.dailyNameCount}.`);
            onPublished?.(result.run);
            if (!onPublished) router.refresh();
            requestAnimationFrame(() => ownRow.current?.focus({ preventScroll: true }));
          } else setError(result.error ?? "Could not publish. Try again.");
        } catch { setError("Connection lost. Your result is safe. Try adding your name again."); }
        finally { setPending(null); }
      }}>
        {daily ? <button type="button" className="join-flag" aria-label={chosen ? `Flag: ${chosen.name}` : "Choose your flag"} aria-haspopup="dialog" disabled={busy} onClick={() => setPicking(true)}>
          {chosen ? <Flag iso2={chosen.iso2} size="s" alt="" eager /> : <GlobeIcon size={20} />}
          <ChevronDownIcon size={12} className="join-flag-chevron" />
        </button> : null}
        <label className="sr-only" htmlFor={id}>{daily ? "Your name on the board (optional)" : "Your name (optional)"}</label>
        <input ref={nameInput} id={id} className="join-name" name="displayName" type="text" minLength={2} maxLength={20} autoComplete="nickname" enterKeyHint="done" placeholder="Your name" value={name}
          onChange={event => { touched.current = true; setName(event.target.value); setError(null); }} aria-invalid={invalidName || undefined} aria-describedby={`${privateNote} ${id}-feedback`} disabled={busy} />
        <button ref={joinButton} className="btn btn-secondary standing-join" type="submit" disabled={busy} aria-busy={pending === "publish" || undefined}>{pending === "publish" ? "Saving" : "Save"}</button>
      </form>
      {daily && !place && suggestion ? <button type="button" className="join-suggest" disabled={busy} onClick={() => choosePlace(suggestion.iso3)}>
        <Flag iso2={suggestion.iso2} size="xs" alt="" eager /><span>{suggestion.name}? <u>Use this flag</u></span>
      </button> : null}
      {renaming ? <button type="button" className="btn btn-tertiary join-cancel" disabled={busy} onClick={() => { setEditing(false); setRenaming(false); setError(null); requestAnimationFrame(() => changeButton.current?.focus({ preventScroll: true })); }}>Cancel</button> : null}
      {daily ? <CountryPicker open={picking} onClose={() => setPicking(false)} value={place} onChange={choosePlace} lastUsed={lastFlag} /> : null}
    </div> : published ? <div className={`join-done${onBoard ? "" : " join-top"}`}>
      <p className="join-done-line">{currentRun.moderationHidden ? <>Your name <b>{published}</b> is under review</> : <>{daily ? "On the board as" : "Saved as"} <b>{published}</b></>}</p>
      <span className="join-done-actions">
        <button ref={changeButton} type="button" className="btn btn-tertiary" onClick={editName} disabled={busy}>Change</button>
        <button ref={removeButton} type="button" className="btn btn-tertiary" disabled={busy} aria-expanded={removing} aria-controls={`${id}-remove`} onClick={() => { setError(null); setRemoving(true); }}>Remove</button>
      </span>
      {removing ? <div id={`${id}-remove`} className="name-remove-confirm"><p>Remove your public name? Your result stays saved under a guest name.</p><div className="name-small-actions">
        <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => void removeName()}>{pending === "remove" ? "Removing" : "Remove name"}</button>
        <button type="button" className="btn btn-tertiary" disabled={busy} onClick={() => { setRemoving(false); requestAnimationFrame(() => removeButton.current?.focus({ preventScroll: true })); }}>Keep it</button>
      </div></div> : null}
    </div> : null}
    <p id={`${id}-feedback`} className="name-feedback" role={error ? "alert" : "status"}>{error ?? notice}</p>
  </>;

  return <section className={`leaderboard-entry name-entry${published && !editing ? " name-published" : ""}${onBoard ? " name-on-board" : ""}`} aria-labelledby={`${id}-heading`}>
    {!onBoard ? <div className="name-heading">
      <h2 id={`${id}-heading`} className="standing-title">{daily ? "Today’s leaderboard" : "Your saved result"}</h2>
      {daily && count !== undefined ? <span className="standing-count">{count.toLocaleString("en-US")} {count === 1 ? "player" : "players"}</span> : null}
    </div> : <h2 id={`${id}-heading`} className="sr-only">Your leaderboard entry</h2>}
    {onBoard ? null : controls}
    <ol ref={list} className={`standing-list${longList ? " standing-scroll" : ""}`} aria-label={onBoard || !daily ? "Your score" : "Today’s leaderboard with your result"} tabIndex={longList ? 0 : undefined}>
      {before.flatMap(publicRow)}
      {currentRun.leaderboard?.gapBeforeYou && before.length ? <li className="standing-gap" aria-label="Other places omitted"><span aria-hidden="true">···</span></li> : null}
      <li ref={ownRow} className={`standing-you${editing ? " standing-you-draft" : ""}`} tabIndex={-1} onClick={editing ? focusName : undefined}>
        {confirmation > 0 && published && !editing && !currentRun.moderationHidden ? <span key={confirmation} className="standing-confirmation" aria-hidden="true" /> : null}
        <RankMarker className="standing-rank" rank={daily ? ownRank : null} />
        <span className="standing-name"><PlayerFlag iso2={shownFlag} className="standing-flag" /><span className="standing-label">
          {ownName ? <><b>{ownName}</b><small className="standing-you-label">You{confirmation > 0 && onPublicBoard && !editing ? <CheckIcon key={confirmation} size={14} className="standing-confirmed-check" /> : null}</small></> : <b>You</b>}
          {ownSub ? <small className="standing-sub">{ownSub}</small> : null}
        </span></span>
        <b className="standing-score num">{currentRun.scoreDisplay}</b>
        <span aria-hidden="true" />
      </li>
      {after.flatMap(publicRow)}
    </ol>
    {empty && !published ? <p className="standing-preview">Be the first on today’s board. Equal scores share a place.</p> : null}
    {daily && currentRun.leaderboard?.available === false ? <div className="standing-unavailable"><span>The leaderboard couldn’t be opened. Your score is saved.</span><button type="button" className="btn btn-secondary" disabled={busy} onClick={async () => {
      setPending("refresh"); setError(null);
      try { const fresh = await refreshResultStanding(run.id); if (fresh) { setCurrentRun(fresh); onPublished?.(fresh); } else setError("Could not refresh. Try again."); }
      catch { setError("Connection lost. Try again."); } finally { setPending(null); }
    }}>{pending === "refresh" ? "Opening leaderboard" : "Try again"}</button></div> : null}
    {onBoard ? controls : null}
  </section>;
}
