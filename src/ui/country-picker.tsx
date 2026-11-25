"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { flagPlaceByIso2, flagPlaceByIso3, flagPlaces } from "@/lib/data/flag-places";
import { countryMatchEntry, rankCountryMatches } from "@/lib/game-logic/geo-wordle/names";
import type { FlagPlace } from "@/types/country";
import { Flag } from "@/ui/flag";
import { CheckIcon } from "@/ui/icons/check";
import { CloseIcon } from "@/ui/icons/close";
import { LockIcon } from "@/ui/icons/lock";
import { SearchIcon } from "@/ui/icons/search";
import { Sheet } from "@/ui/sheet";
import "./country-picker.css";

/**
 * The device's own region (navigator.languages, maximized), as a sovereign country. Only a
 * suggestion: callers show it and wait for a tap, nothing is saved from it.
 */
export function deviceCountry(): FlagPlace | null {
  if (typeof navigator === "undefined") return null;
  try {
    const tags = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const tag of tags) {
      try {
        const region = new Intl.Locale(tag).maximize().region;
        const place = flagPlaceByIso2(region);
        if (place) return place;
      } catch { /* an unusual tag; try the next one */ }
    }
  } catch { /* no Intl.Locale on this browser */ }
  return null;
}

/** Country names in the viewer's language, used for matching ("Deutschland") and as a hint. */
function localNames(): (iso2: string) => string | null {
  try {
    const languages = typeof navigator === "undefined" ? [] : [...(navigator.languages ?? [navigator.language])];
    if (!languages.length || languages.every((tag) => tag.toLowerCase().startsWith("en"))) return () => null;
    const names = new Intl.DisplayNames(languages, { type: "region", fallback: "none" });
    return (iso2) => { try { return names.of(iso2) ?? null; } catch { return null; } };
  } catch {
    return () => null;
  }
}

function fold(text: string): string {
  return Array.from(text, (char) => char.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().charAt(0) || char).join("");
}

/** The matched part of a name in bold, found through accents and case. */
function Highlight({ text, query }: { text: string; query: string }): ReactNode {
  const needle = fold(query.trim());
  const at = needle ? fold(text).indexOf(needle) : -1;
  if (at < 0) return text;
  return <>{text.slice(0, at)}<b>{text.slice(at, at + needle.length)}</b>{text.slice(at + needle.length)}</>;
}

export interface CountryPickerProps {
  open: boolean;
  onClose: () => void;
  /** The chosen ISO3, or "" for a private flag. */
  value: string;
  onChange: (iso3: string) => void;
  /** The country the player picked last time, if any. */
  lastUsed?: string | null;
}

/**
 * The flag picker sheet (design pass 25 November 2026, section 5): search with the GeoWordle
 * name matcher, suggestions from the device and the last choice, a private option and an A to Z
 * list with sticky letters and a letter index. The list ships with the page.
 */
export function CountryPicker({ open, onClose, ...rest }: CountryPickerProps) {
  const titleId = useId();
  return <Sheet open={open} onClose={onClose} labelledBy={titleId} className="flag-sheet">
    {open ? <PickerBody titleId={titleId} onClose={onClose} {...rest} /> : null}
  </Sheet>;
}

interface Row { place: FlagPlace | null; note?: string }

function PickerBody({ titleId, onClose, value, onChange, lastUsed }: Omit<CountryPickerProps, "open"> & { titleId: string }) {
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const local = useMemo(() => localNames(), []);
  const pool = useMemo(() => flagPlaces.map((place) => {
    const localName = local(place.iso2);
    return countryMatchEntry(place, localName ? [localName] : []);
  }), [local]);
  const device = useMemo(() => deviceCountry(), []);
  const searching = query.trim().length > 0;
  const results = useMemo(() => searching ? rankCountryMatches(query, pool, { inside: "always" }) : [], [query, pool, searching]);

  const suggested: Row[] = [];
  const last = flagPlaceByIso3(lastUsed);
  if (last) suggested.push({ place: last, note: "Last used" });
  if (device && device.iso3 !== last?.iso3) suggested.push({ place: device, note: "From your device" });

  const letters = useMemo(() => {
    const groups = new Map<string, FlagPlace[]>();
    for (const place of flagPlaces) {
      const letter = fold(place.name).charAt(0).toUpperCase();
      groups.set(letter, [...(groups.get(letter) ?? []), place]);
    }
    return [...groups.entries()];
  }, []);

  useEffect(() => { list.current?.scrollTo?.({ top: 0 }); }, [query]);

  function pick(iso3: string) {
    onChange(iso3);
    onClose();
  }

  function rows(): HTMLButtonElement[] {
    return Array.from(list.current?.querySelectorAll<HTMLButtonElement>("button.fp-row") ?? []);
  }

  function onInputKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown") { event.preventDefault(); rows()[0]?.focus(); }
    else if (event.key === "Enter") {
      event.preventDefault();
      if (searching && results[0]) pick(results[0].iso3);
    }
  }

  function onListKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const all = rows();
    const at = all.findIndex((row) => row === document.activeElement);
    if (at < 0) return;
    event.preventDefault();
    if (event.key === "ArrowUp" && at === 0) { input.current?.focus(); return; }
    all[Math.max(0, Math.min(all.length - 1, at + (event.key === "ArrowDown" ? 1 : -1)))]?.focus();
  }

  function jump(letter: string) {
    const group = list.current?.querySelector<HTMLElement>(`[data-letter="${letter}"]`);
    if (group && list.current) list.current.scrollTop = group.offsetTop;
  }

  function scrub(event: PointerEvent<HTMLElement>) {
    if (event.type === "pointermove" && event.buttons === 0) return;
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const letter = target instanceof HTMLElement ? target.dataset.jump : undefined;
    if (letter) jump(letter);
  }

  const row = ({ place, note }: Row, query = "") => {
    if (!place) return null;
    const selected = place.iso3 === value;
    const localName = query ? local(place.iso2) : null;
    const hint = note ?? (localName && localName !== place.name ? localName : null);
    return <li key={`${note ?? "row"}-${place.iso3}`}>
      <button type="button" className="fp-row" aria-pressed={selected} onClick={() => pick(place.iso3)}>
        <Flag iso2={place.iso2} size="s" alt="" />
        <span className="fp-name">{query ? <Highlight text={place.name} query={query} /> : place.name}</span>
        {hint ? <span className="fp-note">{hint}</span> : null}
        {selected ? <CheckIcon size={20} className="fp-check" /> : null}
      </button>
    </li>;
  };

  return <div className="fp">
    <span className="fp-handle" aria-hidden="true" />
    <div className="fp-head">
      <h2 id={titleId} className="fp-title">Your flag</h2>
      <button type="button" className="btn btn-icon fp-close" aria-label="Close" onClick={onClose}><CloseIcon size={22} /></button>
    </div>
    <p className="fp-sub">Shown next to your name on every board.</p>
    <div className="fp-search">
      <SearchIcon size={20} className="fp-search-icon" />
      <label className="sr-only" htmlFor={`${titleId}-search`}>Search countries</label>
      <input ref={input} id={`${titleId}-search`} data-autofocus type="search" enterKeyHint="search" autoComplete="off" autoCorrect="off" spellCheck={false}
        placeholder={`Search ${flagPlaces.length} countries`} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={onInputKey} />
      {query ? <button type="button" className="fp-clear" aria-label="Clear search" onClick={() => { setQuery(""); input.current?.focus(); }}><CloseIcon size={18} /></button> : null}
    </div>
    <div className="fp-body">
    <div ref={list} className="fp-scroll" onKeyDown={onListKey}>
      {searching ? <>
        <p className="fp-section" role="status">{results.length ? `${results.length} ${results.length === 1 ? "country" : "countries"}` : ""}</p>
        {results.length ? <ul className="fp-list" aria-label="Matching countries">{results.map((place) => row({ place }, query))}</ul>
          : <p className="fp-empty">No country matches ‘{query.trim()}’.</p>}
      </> : <>
        {suggested.length ? <><p className="fp-section">Suggested</p><ul className="fp-list" aria-label="Suggested">{suggested.map((item) => row(item))}</ul></> : null}
        <ul className="fp-list fp-private" aria-label="Privacy">
          <li><button type="button" className="fp-row" aria-pressed={!value} onClick={() => pick("")}>
            <span className="fp-lock" aria-hidden="true"><LockIcon size={16} /></span>
            <span className="fp-name">Keep my flag private</span>
            {!value ? <CheckIcon size={20} className="fp-check" /> : null}
          </button></li>
        </ul>
        <ul className="fp-list fp-az" aria-label="All countries">
          {letters.map(([letter, places]) => <li key={letter} className="fp-group" data-letter={letter}>
            <p className="fp-letter" aria-hidden="true">{letter}</p>
            <ul>{places.map((place) => row({ place }))}</ul>
          </li>)}
        </ul>
      </>}
    </div>
    {!searching ? <nav className="fp-index" aria-hidden="true" onPointerDown={scrub} onPointerMove={scrub}>
      {letters.map(([letter]) => <span key={letter} data-jump={letter}>{letter}</span>)}
    </nav> : null}
    </div>
  </div>;
}
