"use client";

import { Flag } from "@/ui/flag";
import type { ResultProps } from "@/games/types";
import { statLabel } from "@/games/_shared/format";
import { callLog, settled, type HoLState } from "./module";

/**
 * The rows under the result card (blueprint 8.8): the last five pairs, each `left vs right`
 * with the stat under it and the call you made at the right. The call that ended the streak
 * is the only one in ember; the rest stay mute, so the row that cost the run reads at a
 * glance without a second colour family.
 */
export function Result({ state }: ResultProps<HoLState>) {
  const log = callLog(settled(state));
  if (log.length === 0) return null;
  const rows = log.slice(-5);
  return (
    <div>
      <div className="rhead">
        <b className="t-h3">Last calls</b>
        {rows.length < log.length ? (
          <span className="rfacts t-body">
            {rows.length} of <b>{log.length}</b> rounds
          </span>
        ) : null}
      </div>
      <div className="rrows t-row">
        {rows.map(({ index, round, call, ok }) => (
          // `flags4` is the house row for a flag stack: it drops the fixed 26 px identity
          // column, which two flags overflow, and lets the pair of country names wrap
          // instead of losing the second one to the row's ellipsis.
          <div key={index} className="rrow flags4">
            <span className="flags">
              <Flag iso2={round.left.iso2} size="xs" alt="" />
              <Flag iso2={round.right.iso2} size="xs" alt="" />
            </span>
            <span className="nm">
              {round.left.displayName} vs {round.right.displayName}
              <small className="t-meta">{statLabel(round.category.slug, round.category.shortLabel)}</small>
            </span>
            <span className={ok ? "v mute t-meta" : "v bad t-meta"}>{call}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
