"use client";

import { FoundList } from "@/games/_shared/found-list";
import type { ResultProps } from "@/games/types";
import type { CapitalState } from "./module";

/**
 * The Capital Match result rows (blueprint 8.8, the Flag Quiz grammar): the ten countries in
 * the order they were asked, each with its real capital and a check or a cross. The score
 * itself is the panel's Erode number. The capital is the answer the round was about, so it
 * takes the row's value slot: a missed row reads country, capital, cross, which is the one
 * thing a player wants off this screen.
 */
export function Result({ state }: ResultProps<CapitalState>) {
  return (
    <FoundList
      items={state.g.questions.map((q, i) => ({
        iso2: q.country.iso2,
        name: q.country.displayName,
        value: q.correctCapital,
        ok: state.g.answers[i] === q.correctIndex,
      }))}
    />
  );
}
