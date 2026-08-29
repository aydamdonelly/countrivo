"use client";

import { useState } from "react";
import { getValidNeighbors } from "@/lib/game-logic/borderline/engine";
import { Flag } from "@/ui/flag";
import { ChevronRightIcon } from "@/ui/icons/chevron-right";
import { Subject } from "@/ui/subject";
import { Suggest, type SuggestItem } from "@/ui/suggest";
import type { BoardProps } from "@/games/types";
import type { BorderlineAction, BorderlineState } from "./module";

/** Borderline (blueprint 8.8): start to target across land borders, typed or tapped. */
export function Board({ state, dispatch, busy }: BoardProps<BorderlineState, BorderlineAction>) {
  const [text, setText] = useState("");
  const g = state.g;
  const live = g.phase === "playing";
  const visited = new Set(g.path.map((c) => c.iso3));
  const neighbours = getValidNeighbors(g.currentCountry.iso3).filter((c) => !visited.has(c.iso3));
  const needle = text.trim().toLowerCase();
  const items: SuggestItem[] = needle ? neighbours.filter((c) => c.displayName.toLowerCase().includes(needle)).slice(0, 5).map((c) => ({ key: c.iso3, iso2: c.iso2, name: c.displayName })) : [];

  function move(name: string) {
    dispatch({ t: "move", name });
    setText("");
  }

  return (
    <div className="play-stack">
      <div className="start-target t-body">
        <span className="side">
          <Flag iso2={g.startCountry.iso2} size="m" alt="" eager />
          <span>{g.startCountry.displayName}</span>
          <small className="t-meta">Start</small>
        </span>
        <ChevronRightIcon size={18} className="chev" />
        <span className="side">
          <Flag iso2={g.targetCountry.iso2} size="m" alt="" eager />
          <span>{g.targetCountry.displayName}</span>
          <small className="t-meta">Target</small>
        </span>
      </div>
      <Subject key={g.currentCountry.iso3} iso2={g.currentCountry.iso2} name={g.currentCountry.displayName} meta="You are here" animate={g.moveCount > 0} />
      {live ? (
        <>
          <Suggest
            id="borderline-move"
            label="Bordering country"
            hideLabel
            placeholder="Type a bordering country"
            value={text}
            onChange={setText}
            items={items}
            onSelect={(it) => move(it.name)}
            onSubmit={(raw) => move(raw)}
            max={5}
            error={state.error}
            disabled={busy}
            autoComplete="off"
            autoCapitalize="words"
            enterKeyHint="go"
          />
          <div className="chip-row">
            {neighbours.map((c) => (
              <button key={c.iso3} type="button" className="chip t-kicker" onClick={() => move(c.displayName)}>
                {c.displayName}
              </button>
            ))}
          </div>
        </>
      ) : null}
      <div className="path">
        {g.path.map((c, i) => (
          <span key={c.iso3} className="path-step">
            {i > 0 ? <ChevronRightIcon size={14} className="chev" /> : null}
            <Flag iso2={c.iso2} size="xs" alt={c.displayName} />
          </span>
        ))}
      </div>
    </div>
  );
}
