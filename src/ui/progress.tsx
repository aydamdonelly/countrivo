import { cn } from "@/lib/utils";
import { Flame } from "@/ui/flame";

export type PipState = "done" | "current" | "todo" | "miss";

/** Above this many pips the left side shows a 3 px bar (or nothing without a total). */
export const MAX_PIPS = 20;

export interface ProgressProps {
  done: number;
  total?: number;
  /** `score`, `streak`, `found`. */
  label: string;
  /** `412`, `7`, `3/9`. */
  value: string;
  /** `4 picks left`, `0:42`. */
  extra?: string;
  /** Force the bar instead of pips. */
  bar?: boolean;
  /** Pip indices drawn as a mistake (ember outline). */
  misses?: readonly number[];
  /** The current pip; defaults to the first undone one. */
  current?: number | null;
  /** Explicit pip states (overrides the derivation). */
  pips?: readonly PipState[];
  /** The streak games: a burning flame before the label (blueprint 8.8). */
  flame?: boolean;
  className?: string;
}

export function derivePips({ done, total = 0, misses = [], current }: Pick<ProgressProps, "done" | "total" | "misses" | "current">): PipState[] {
  const cur = current === undefined ? (done < total ? done : null) : current;
  return Array.from({ length: Math.min(total, MAX_PIPS) }, (_, i) => {
    if (misses.includes(i)) return "miss";
    if (i === cur) return "current";
    if (i < done) return "done";
    return "todo";
  });
}

/**
 * The session line (blueprint 3.19): 6x6 pips (done ink, current ember, remaining wait,
 * mistake ember outline) or a 3 px bar, and the label + Erode value at the right.
 */
export function Progress({ done, total, label, value, extra, bar, misses, current, pips, flame, className }: ProgressProps) {
  const showBar = bar || (total != null && total > MAX_PIPS);
  const states = !showBar && total ? pips ?? derivePips({ done, total, misses, current }) : null;
  const pct = total ? Math.max(0, Math.min(100, Math.round((done / total) * 100))) : 0;
  return (
    <div className={cn("prog", className)}>
      {states ? (
        <div className="pips" role="img" aria-label={`${done} of ${total}`}>
          {states.map((s, i) => (
            <span key={i} className={cn("pip", s === "done" && "done", s === "current" && "cur", s === "miss" && "miss")} />
          ))}
        </div>
      ) : showBar && total ? (
        <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
          <i style={{ width: `${pct}%` }} />
        </div>
      ) : null}
      <div className="score">
        {flame ? <Flame size={18} /> : null}
        <span className="lbl t-meta">{label}</span>
        <b className="t-score num">{value}</b>
        {extra ? <span className="extra t-meta num">{extra}</span> : null}
      </div>
    </div>
  );
}
