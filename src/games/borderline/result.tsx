"use client";

import { Flag } from "@/ui/flag";
import type { ResultProps } from "@/games/types";
import type { BorderlineState } from "./module";

/** The head line and the path you took, start to target. */
export function Result({ state }: ResultProps<BorderlineState>) {
  const g = state.g;
  const extra = g.moveCount - g.optimalLength;
  const last = g.path.length - 1;
  return (
    <div>
      <div className="rhead">
        <b className="t-h3">{extra === 0 ? "Perfect." : extra === 1 ? "One step over." : `${extra} steps over.`}</b>
        <span className="rfacts t-body">
          you <b>{g.moveCount}</b> · optimal <b>{g.optimalLength}</b>
        </span>
      </div>
      <div className="rrows t-row">
        {g.path.map((c, i) => (
          <div key={c.iso3} className="rrow">
            <Flag iso2={c.iso2} size="xs" alt="" />
            <span className="nm">{c.displayName}</span>
            <span className="v mute t-meta">{i === 0 ? "start" : i === last ? "target" : `step ${i}`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
