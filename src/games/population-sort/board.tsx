"use client";

import { cn, formatStat } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Flag } from "@/ui/flag";
import { ArrowDownIcon } from "@/ui/icons/arrow-down";
import { ArrowUpIcon } from "@/ui/icons/arrow-up";
import { StatIcon } from "@/ui/icons/stat";
import type { BoardProps } from "@/games/types";
import { moved, type SortAction, type SortState } from "./module";

/** Population Sort (blueprint 8.8): six rows with up and down arrows, Submit order; the finished board shows the values. */
export function Board({ state, dispatch, busy }: BoardProps<SortState, SortAction>) {
  const { g } = state;
  const live = g.phase === "playing";
  const n = g.userOrder.length;
  return (
    <div className="play-stack">
      <div className="stat-line t-list">
        <StatIcon slug={g.category.slug} size={22} />
        <span>{g.category.label}</span>
        <span className="mult t-meta">highest first</span>
      </div>
      <div className="play-stack" style={{ gap: 8 }}>
        {g.userOrder.map((ci, pos) => {
          const c = g.countries[ci];
          return (
            <div key={c.iso3} className={cn("sort-row t-list", live && state.cursor === pos && "cur")}>
              <b className="pos t-num num">{pos + 1}</b>
              <Flag iso2={c.iso2} size="xs" alt="" />
              <span className="nm">{c.displayName}</span>
              {live ? (
                <>
                  <button type="button" aria-label={`Move ${c.displayName} up`} disabled={busy || pos === 0} onClick={() => dispatch({ t: "order", perm: moved(g.userOrder, pos, pos - 1) })}>
                    <ArrowUpIcon size={20} />
                  </button>
                  <button type="button" aria-label={`Move ${c.displayName} down`} disabled={busy || pos === n - 1} onClick={() => dispatch({ t: "order", perm: moved(g.userOrder, pos, pos + 1) })}>
                    <ArrowDownIcon size={20} />
                  </button>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
      {live ? (
        <div className="play-actions">
          <Button variant="ink" onClick={() => dispatch({ t: "submit" })} disabled={busy}>
            Submit order
          </Button>
        </div>
      ) : null}
    </div>
  );
}
