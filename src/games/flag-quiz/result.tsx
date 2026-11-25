import { FoundList } from "@/games/_shared/found-list";
import type { FlagSprintView } from "@/games/quick-views";

/**
 * The sprint result rows: every flag the run showed, in order, with its country, a check or
 * a cross, and the name picked instead for a miss, so a wrong flag is learnt rather than
 * only counted. The count itself is the card's Erode number. Open by default below target.
 */
export function Result({ view }: { view: FlagSprintView }) {
  const lost = view.wrong * view.penaltySeconds;
  if (!view.seen.length) return <p className="t-meta text-mute fs-result">The clock ran out before the first answer.</p>;
  return (
    <details className="qr-history fs-seen" open>
      <summary>Flags you saw <span className="disclosure-count">{view.correct} right, {view.wrong} wrong</span></summary>
      {lost > 0 ? <p className="t-meta text-mute fs-summary"><b className="num">{lost} s</b> lost to wrong answers.</p> : null}
      <FoundList items={view.seen.map((row) => ({ iso2: row.iso2, name: row.name, ok: row.correct, value: row.correct ? undefined : row.guess === null ? "Time ran out" : `You picked ${row.guess}` }))} />
    </details>
  );
}
