"use client";

import type { ResultProps } from "@/games/types";
import { FoundList } from "@/games/_shared/found-list";
import type { ExampleState } from "./module";

/** The reference result rows: one per round, right or missed. */
export function Result({ state }: ResultProps<ExampleState>) {
  return <FoundList items={state.rounds.map((r, i) => ({ iso2: r.country.iso2, name: r.country.displayName, ok: state.answers[i] === r.correctIndex }))} />;
}
