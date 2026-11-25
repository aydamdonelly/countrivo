import { FoundList } from "@/games/_shared/found-list";
import type { FlagSprintView } from "@/games/quick-views";

/**
 * The sprint result rows: every flag the run showed, in order, with its country, a check or
 * a cross, and the name picked instead for a miss, so a wrong flag is learnt rather than
 * only counted. The count itself is the panel's Erode number.
 */
export function Result({ view }: { view: FlagSprintView }) {
  const lost = view.wrong * view.penaltySeconds;
  return (
    <div className="fs-result">
      <p className="t-body fs-summary">
        <b className="num">{view.correct}</b> right, <b className="num">{view.wrong}</b> wrong{lost > 0 ? <>, <b className="num">{lost} s</b> lost to wrong answers</> : null}.
      </p>
      {view.seen.length ? (
        <details className="qr-history fs-seen" open>
          <summary className="t-body">Flags you saw</summary>
          <FoundList items={view.seen.map((row) => ({ iso2: row.iso2, name: row.name, ok: row.correct, value: row.correct ? undefined : row.guess === null ? "Time ran out" : `You picked ${row.guess}` }))} />
        </details>
      ) : (
        <p className="t-meta text-mute">The clock ran out before the first answer.</p>
      )}
    </div>
  );
}
