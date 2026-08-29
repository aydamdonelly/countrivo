"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { sendFriendRequest } from "@/app/actions/friends";
import { findPlayers, type FoundPlayer } from "./actions";
import { Button } from "@/ui/button";
import { Crest } from "@/ui/crest";
import { Field } from "@/ui/field";
import { SectionHead } from "@/ui/section-head";
import { useToast } from "@/ui/toast";
import { SearchIcon } from "@/ui/icons/search";

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

/**
 * Find players (blueprint 7.14): one field, a 300 ms debounce, two characters minimum, then
 * rows with a crest, the name, the handle and an Add that becomes Sent. The list is in the
 * flow under the field, so nothing covers the keyboard.
 */
export function FriendSearch() {
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<{ query: string; rows: readonly FoundPlayer[] } | null>(null);
  const [sent, setSent] = useState<readonly string[]>([]);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const seq = useRef(0);

  const term = query.trim();
  /* What is on screen is derived, never cleared from inside the effect: under two characters
     the list is simply not rendered, and the last answer stays put while the next one is in
     flight, so the rows never blink between keystrokes. */
  const searching = term.length >= MIN_CHARS;
  const results = searching && found ? found.rows : [];
  const nothingFound = searching && found !== null && found.rows.length === 0;

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_CHARS) return;
    const run = ++seq.current;
    const timer = window.setTimeout(() => {
      void findPlayers(q).then((rows) => {
        if (run === seq.current) setFound({ query: q, rows });
      });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  function add(id: string) {
    setSent((s) => [...s, id]);
    startTransition(async () => {
      const res = await sendFriendRequest(id);
      if (res.success) toast("Request sent");
      else setSent((s) => s.filter((x) => x !== id));
    });
  }

  return (
    <section className="sec">
      <SectionHead title="Find players" />
      <div className="find">
        <SearchIcon size={20} />
        <Field
          id="friend-search"
          label="Search by name"
          hideLabel
          type="search"
          autoComplete="off"
          enterKeyHint="search"
          placeholder="Search by name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {results.map((p) => (
        <div key={p.id} className="prow t-row">
          <Crest path={p.crest} size={26} label={p.displayName ?? p.username} />
          <span className="who">
            <span className="nm">{p.displayName ?? p.username}</span>
            <span className="sub t-meta">@{p.username}</span>
          </span>
          {sent.includes(p.id) ? (
            <span className="sent t-meta">Sent</span>
          ) : (
            <Button variant="text" onClick={() => add(p.id)} disabled={pending}>
              Add
            </Button>
          )}
        </div>
      ))}
      {nothingFound ? <p className="empty-row t-body">No players found.</p> : null}
    </section>
  );
}
