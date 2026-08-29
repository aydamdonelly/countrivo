"use client";

import { Flag } from "@/ui/flag";
import type { ResultProps } from "@/games/types";
import { statLabel } from "@/games/_shared/format";
import { callLog, settled, type HoLState } from "./module";

/** The last five pairs (blueprint 8.8): left vs right, the stat, your call; the wrong one in ember. */
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
          <div key={index} className="rrow">
            <Flag iso2={round.right.iso2} size="xs" alt="" />
            {/* two country names in one cell: let the pair wrap rather than lose the
                second name to the row's ellipsis */}
            <span className="nm" style={{ whiteSpace: "normal" }}>
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
