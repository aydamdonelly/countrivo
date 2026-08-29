"use client";

import { useState } from "react";
import { getAllCountries, getCountryByIso3 } from "@/lib/data/countries";
import type { BorderBuddiesState } from "@/lib/game-logic/border-buddies/engine";
import { Button } from "@/ui/button";
import { Suggest, type SuggestItem } from "@/ui/suggest";
import type { BoardProps } from "@/games/types";
import { CountryBlock } from "@/games/_shared/country-block";
import { FoundList } from "@/games/_shared/found-list";
import type { BorderAction } from "./module";

/** Border Buddies (blueprint 8.8): the country, "Name every neighbour", a field with Add, the found list, Give up. */
export function Board({ state, dispatch, busy }: BoardProps<BorderBuddiesState, BorderAction>) {
  const [text, setText] = useState("");
  const live = state.phase === "playing";
  const needle = text.trim().toLowerCase();
  const found = new Set(state.found);
  const items: SuggestItem[] = needle
    ? getAllCountries()
        .filter((c) => c.iso3 !== state.country.iso3 && !found.has(c.iso3) && c.displayName.toLowerCase().includes(needle))
        .slice(0, 6)
        .map((c) => ({ key: c.iso3, iso2: c.iso2, name: c.displayName }))
    : [];
  function submit(iso3: string) {
    dispatch({ t: "found", iso3 });
    setText("");
  }
  function submitRaw(raw: string) {
    const n = raw.trim().toLowerCase();
    const exact = getAllCountries().find((c) => c.displayName.toLowerCase() === n || c.name.toLowerCase() === n);
    const pick = exact ?? (items[0] ? getCountryByIso3(items[0].key) : undefined);
    if (pick) submit(pick.iso3);
  }
  const rows = (live ? state.found : state.borders).map((iso3) => {
    const c = getCountryByIso3(iso3);
    return { iso2: c?.iso2 ?? "", name: c?.displayName ?? iso3, ok: found.has(iso3) };
  });
  return (
    <div className="play-stack">
      <CountryBlock country={state.country} meta="Name every neighbour" alt={state.country.displayName} />
      {live ? (
        <div className="typed">
          <Suggest id="border-guess" label="Country" hideLabel placeholder="Type a country" value={text} onChange={setText} items={items} onSelect={(it) => submit(it.key)} onSubmit={submitRaw} max={6} disabled={busy} autoComplete="off" autoCapitalize="words" enterKeyHint="go" />
          <Button variant="ink" onClick={() => submitRaw(text)} disabled={busy || !text.trim()}>
            Add
          </Button>
        </div>
      ) : null}
      {rows.length ? <FoundList items={rows} /> : null}
      {live ? (
        <div className="play-actions">
          <Button variant="quiet" onClick={() => dispatch({ t: "giveup" })} disabled={busy}>
            Give up
          </Button>
        </div>
      ) : null}
    </div>
  );
}
