"use client";

import type { BlitzState } from "@/lib/game-logic/blitz/engine";
import type { ResultProps } from "@/games/types";
import { FoundList } from "@/games/_shared/found-list";
import { averageSeconds } from "./module";

/** The average time and the ten rounds, each with its time or `missed`. */
export function Result({ state }: ResultProps<BlitzState>) {
  const avg = averageSeconds(state);
  return (
    <div>
      <p className="rhead t-body">
        <span className="rfacts">{avg ? <>avg <b>{avg}</b></> : "No answer landed."}</span>
      </p>
      <FoundList
        items={state.rounds.map((r) => ({
          iso2: r.country.iso2,
          name: r.country.displayName,
          ok: r.correct,
          value: r.correct && r.timeMs !== null ? `${(r.timeMs / 1000).toFixed(1)} s` : "missed",
        }))}
      />
    </div>
  );
}
