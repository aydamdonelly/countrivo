import { Flag } from "@/ui/flag";
import { CheckIcon } from "@/ui/icons/check";
import { ChevronDownIcon } from "@/ui/icons/chevron-down";
import { CrossIcon } from "@/ui/icons/cross";
import type { ResultProps } from "@/games/types";
import { callLog, cardValue, type HoLState } from "./module";

/** Practice can run long; the disclosure keeps the last ten calls. */
const SHOWN = 10;

/**
 * R6 "How it went" (concept 6.R): a closed disclosure with the pairs, each `left vs right`
 * with both values under it, the call that was made, and right or wrong as a word-bearing
 * icon. On the daily the points the call earned sit at the right (`+2` from call 8).
 */
export function Result({ state }: ResultProps<HoLState>) {
  const g = state.g;
  const log = callLog(g);
  if (log.length === 0) return null;
  const rows = log.slice(-SHOWN);
  const daily = g.mode === "daily";
  return (
    <details className="group">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 py-2">
        <b className="t-h3">How it went</b>
        <span className="text-mute transition-transform group-open:rotate-180">
          <ChevronDownIcon size={20} />
        </span>
      </summary>
      <div className="rrows t-row">
        {rows.map((r) => (
          <div key={r.index} className="rrow flags4">
            <span className="flags">
              <Flag iso2={r.left.iso2} size="xs" alt="" />
              <Flag iso2={r.right.iso2} size="xs" alt="" />
            </span>
            <span className="nm">
              {r.left.name} vs {r.right.name}
              <small className="t-meta">
                {cardValue(g.stat, r.left.value)} vs {cardValue(g.stat, r.right.value)}, you said {r.call}
              </small>
            </span>
            <span className="v flex items-center gap-1">
              {r.ok ? (
                <span className="ic-ok flex">
                  <CheckIcon size={18} title="Right" />
                </span>
              ) : (
                <span className="ic-miss flex">
                  <CrossIcon size={18} title="Wrong" />
                </span>
              )}
              {daily ? <b className="t-num num w-6 text-right">{r.points > 0 ? `+${r.points}` : "0"}</b> : null}
            </span>
          </div>
        ))}
      </div>
    </details>
  );
}
