"use client";

import type { ResultProps } from "@/games/types";
import { FoundList } from "@/games/_shared/found-list";
import type { CapitalState } from "./module";

/** Ten rows: the flag, the country, its capital, a check or a cross. */
export function Result({ state }: ResultProps<CapitalState>) {
  return <FoundList items={state.g.questions.map((q, i) => ({ iso2: q.country.iso2, name: q.country.displayName, value: q.correctCapital, ok: state.g.answers[i] === q.correctIndex }))} />;
}
