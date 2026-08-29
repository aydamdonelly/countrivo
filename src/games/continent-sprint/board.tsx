"use client";

import { useEffect, useState } from "react";
import { getCountriesByContinent, getCountryByIso3 } from "@/lib/data/countries";
import type { SprintState } from "@/lib/game-logic/continent-sprint/engine";
import { Button } from "@/ui/button";
import { Options, OptionButton } from "@/ui/options";
import { Suggest, type SuggestItem } from "@/ui/suggest";
import type { BoardProps } from "@/games/types";
import { FoundList } from "@/games/_shared/found-list";
import { SPRINT_CONTINENTS, type SprintAction } from "./module";

/** Continent Sprint (blueprint 8.8): pick a continent, then name countries against the clock, Finish. */
export function Board({ state, dispatch, busy }: BoardProps<SprintState, SprintAction>) {
  const [text, setText] = useState("");
  const playing = state.phase === "playing";
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => dispatch({ t: "tick", now: Date.now(), ui: true }), 1000);
    return () => window.clearInterval(id);
  }, [playing, dispatch]);

  if (state.phase === "picking") {
    return (
      <div className="play-stack">
        <p className="t-body play-line play-center">Pick a continent.</p>
        <Options busy={busy}>
          {SPRINT_CONTINENTS.map((c) => (
            <OptionButton key={c} label={c} small={`${getCountriesByContinent(c).length} countries`} onClick={() => dispatch({ t: "start", continent: c, now: Date.now() })} />
          ))}
        </Options>
      </div>
    );
  }

  const found = new Set(state.found);
  const needle = text.trim().toLowerCase();
  const items: SuggestItem[] = needle
    ? state.allCountries
        .filter((c) => !found.has(c.iso3) && c.displayName.toLowerCase().includes(needle))
        .slice(0, 6)
        .map((c) => ({ key: c.iso3, iso2: c.iso2, name: c.displayName }))
    : [];
  function submit(iso3: string) {
    dispatch({ t: "found", iso3 });
    setText("");
  }
  function submitRaw(raw: string) {
    const n = raw.trim().toLowerCase();
    const exact = state.allCountries.find((c) => c.displayName.toLowerCase() === n || c.name.toLowerCase() === n);
    const pick = exact ?? (items[0] ? getCountryByIso3(items[0].key) : undefined);
    if (pick) submit(pick.iso3);
    else if (n) dispatch({ t: "found", iso3: "---" });
  }
  const rows = [...state.found].reverse().map((iso3) => {
    const c = getCountryByIso3(iso3);
    return { iso2: c?.iso2 ?? "", name: c?.displayName ?? iso3, ok: true };
  });
  return (
    <div className="play-stack">
      <p className="t-body play-line play-center">
        <b>{state.continent}</b> · name every country in it
      </p>
      {playing ? (
        <div className="typed">
          <Suggest id="sprint-guess" label="Country" hideLabel placeholder="Type a country" value={text} onChange={setText} items={items} onSelect={(it) => submit(it.key)} onSubmit={submitRaw} max={6} disabled={busy} autoComplete="off" autoCapitalize="words" enterKeyHint="go" />
          <Button variant="ink" onClick={() => dispatch({ t: "finish", now: Date.now() })} disabled={busy}>
            Finish
          </Button>
        </div>
      ) : null}
      {rows.length ? <FoundList items={rows} scroll /> : null}
    </div>
  );
}
