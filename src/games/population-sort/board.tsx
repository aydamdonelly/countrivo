"use client";

import type { CSSProperties, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Flag } from "@/ui/flag";
import { Subject } from "@/ui/subject";
import { ArrowDownIcon } from "@/ui/icons/arrow-down";
import { ArrowUpIcon } from "@/ui/icons/arrow-up";
import { CheckIcon } from "@/ui/icons/check";
import { CrossIcon } from "@/ui/icons/cross";
import type { BoardProps } from "@/games/types";
import { statLabel } from "@/games/_shared/format";
import { moved, placedRight, type SortAction, type SortState } from "./module";

/** The verdict mark of a settled row sits exactly where the down arrow stood. */
const MARK: CSSProperties = { width: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" };

/**
 * Enter and Space belong to whichever control holds focus: the window key map would
 * otherwise swallow them (it prevents the default before it acts) and a focused arrow
 * would answer nothing.
 */
function holdKeys(e: KeyboardEvent<HTMLDivElement>): void {
  if (e.key === "Enter" || e.key === " ") e.stopPropagation();
}

/**
 * Population Sort (blueprint 8.8): the statistic on top, six rows to order highest first,
 * one submit. Everything renders from `state`, so the server's first HTML is the whole
 * board. Each row moves with its own arrows; the keyboard drives a cursor with the arrow
 * keys, moves the cursor row up with Space and submits with Enter. When the order is in,
 * the arrows go and every row says whether it landed right (the board is kept above the
 * result panel, so it stays the record of what the player actually did).
 */
export function Board({ state, dispatch, busy }: BoardProps<SortState, SortAction>) {
  const { g, cursor } = state;
  const live = g.phase === "playing";
  const n = g.userOrder.length;
  return (
    <div className="play-stack">
      <Subject variant="stat" slug={g.category.slug} label={statLabel(g.category.slug, g.category.label)} clarifier={g.category.clarifier} />
      <div className="play-stack" style={{ gap: 8 }} onKeyDown={holdKeys}>
        {g.userOrder.map((ci, pos) => {
          const country = g.countries[ci];
          const right = !live && placedRight(g, pos);
          return (
            <div key={country.iso3} className={cn("sort-row t-list", live && cursor === pos && "cur")}>
              <b className="pos t-num num">{pos + 1}</b>
              <Flag iso2={country.iso2} size="xs" alt="" />
              <span className="nm">{country.displayName}</span>
              {live ? (
                <>
                  <button
                    type="button"
                    aria-label={`Move ${country.displayName} up`}
                    disabled={busy || pos === 0}
                    onClick={() => dispatch({ t: "order", perm: moved(g.userOrder, pos, pos - 1), at: pos - 1 })}
                  >
                    <ArrowUpIcon size={20} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${country.displayName} down`}
                    disabled={busy || pos === n - 1}
                    onClick={() => dispatch({ t: "order", perm: moved(g.userOrder, pos, pos + 1), at: pos + 1 })}
                  >
                    <ArrowDownIcon size={20} />
                  </button>
                </>
              ) : (
                <span style={MARK}>
                  {right ? <CheckIcon size={18} color="ink" title="in place" /> : <CrossIcon size={18} color="ember" title="out of place" />}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {live ? (
        <div className="play-actions" onKeyDown={holdKeys}>
          <Button variant="ink" onClick={() => dispatch({ t: "submit" })} disabled={busy}>
            Submit order
          </Button>
        </div>
      ) : null}
    </div>
  );
}
