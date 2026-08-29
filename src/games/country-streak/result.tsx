"use client";

import type { ResultProps } from "@/games/types";
import { FoundList } from "@/games/_shared/found-list";
import type { StreakState } from "./module";

/** The last five flags with a check or a cross; a streak of 0 reads "First answer is the hardest." */
export function Result({ state }: ResultProps<StreakState>) {
  const g = state.g;
  const lostAt = g.phase === "gameover" && g.streak < g.queue.length ? g.currentIndex : -1;
  const last = g.streak === 0 ? [] : Array.from({ length: Math.min(5, g.currentIndex + (lostAt >= 0 ? 1 : 0)) }, (_, k) => g.currentIndex - k).reverse();
  const rows = (lostAt >= 0 ? [...last.filter((i) => i !== lostAt), lostAt] : last).map((i) => ({ iso2: g.queue[i].iso2, name: g.queue[i].displayName, ok: i !== lostAt }));
  if (g.streak === 0) {
    return (
      <div>
        <p className="t-body play-line">First answer is the hardest.</p>
        {lostAt >= 0 ? <FoundList items={[{ iso2: g.queue[lostAt].iso2, name: g.queue[lostAt].displayName, ok: false }]} /> : null}
      </div>
    );
  }
  return <FoundList items={rows} />;
}
