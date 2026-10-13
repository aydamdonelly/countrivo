"use client";

import { FoundList } from "@/games/_shared/found-list";
import type { ResultProps } from "@/games/types";
import type { QuizState } from "./module";

/**
 * The Flag Quiz result rows (R6): the ten flags in the order they were asked, each with its
 * country name and a check or a cross; the three lookalikes carry their double weight. The
 * points themselves are the panel's Erode number.
 */
export function Result({ state }: ResultProps<QuizState>) {
  return (
    <FoundList
      items={state.g.questions.map((q, i) => ({
        iso2: q.country.iso2,
        name: q.country.displayName,
        ok: state.g.answers[i] === q.correctIndex,
        value: q.points > 1 ? "counts double" : undefined,
      }))}
    />
  );
}
