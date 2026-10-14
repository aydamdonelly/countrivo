import { useState } from "react";
import { currentIndex, isComplete, slotOwner } from "@/lib/game-logic/blind-pick/display";
import { statWording } from "@/lib/game-logic/blind-pick/display";
import { tierFor } from "@/lib/game-logic/blind-pick/scoring";
import { cn } from "@/lib/utils";
import { CountUp } from "@/ui/count-up";
import { StatIcon } from "@/ui/icons/stat";
import type { BoardProps } from "@/games/types";
import { BpFlag } from "./bp-flag";
import type { BlindPickAction, BlindPickState } from "./module";
import { PICK_COUNT } from "@/lib/game-logic/blind-pick/display";
import "./blind-pick.css";

/*
 * The Blind Pick board (pane BP1). The arriving country on a plain card, then the six stat
 * slots: two columns of three on phones (167 x 72), one row of six at 150 x 96 across the
 * 960 column on desktop. A placed slot flips to "#12 of 193", the tier word and the country's
 * flag at 20. Everything is drawn from `state`, so the server HTML is already the board and a
 * resumed run arrives with its placements in place.
 *
 * The card and the slots are card fill on the paper ground, in the daily and in practice.
 */
export function Board({ state, dispatch, busy, mode, pendingSlot }: BoardProps<BlindPickState, BlindPickAction> & { pendingSlot?: number | null }) {
  const { g } = state;
  const cfg = g.config;
  const complete = isComplete(g);
  const idx = currentIndex(g);
  const country = cfg.countries[idx];
  const lastSlot = g.placements.length > 0 ? g.placements[g.placements.length - 1] : -1;

  // Snapshot the move count at mount: a board that arrives resumed is settled, and only what
  // moves after that slides in or flips.
  const [movesAtMount] = useState(state.moves);
  const moved = state.moves > movesAtMount;

  const lastCountry = g.placements.length > 0 ? cfg.countries[g.placements.length - 1] : null;
  const lastRank = lastCountry ? cfg.costMatrix[g.placements.length - 1][lastSlot] : null;

  return (
    <div className={cn("bp", mode === "practice" && "bp-practice")}>
      <div className="bp-arrive">
        <p className="bp-count t-meta">
          Country <span className="num">{idx + 1}</span> of {PICK_COUNT}
        </p>
        <div key={idx} className={cn("bp-card", moved && !complete && "bp-in")}>
          <BpFlag iso2={country.iso2} w={64} h={43} alt="" />
          <span className="bp-who">
            <b className="t-h3">{country.displayName}</b>
            <span className="t-meta">{country.region}</span>
          </span>
        </div>
      </div>

      <div className="bp-slots">
        {cfg.categories.map((cat, i) => {
          const label = statWording(cat.slug);
          const owner = slotOwner(g, i);
          if (owner >= 0) {
            const placed = cfg.countries[owner];
            const rank = cfg.costMatrix[owner][i];
            const fresh = moved && lastSlot === i;
            return (
              <div key={cat.slug} className={cn("bp-slot placed", fresh && "bp-flip")} data-state="placed">
                <BpFlag className="bp-sflag" iso2={placed.iso2} w={20} h={15} alt={placed.displayName} />
                <b className="bp-rank t-num">
                  #{fresh ? <CountUp value={rank} duration={300} pop /> : <span className="num">{rank}</span>}
                  <span className="bp-of"> of {cfg.of[i]}</span>
                </b>
                <span className="bp-tier t-meta">{tierFor(rank, cfg.of[i])}</span>
                <span className="bp-slbl t-meta">{label}</span>
              </div>
            );
          }
          return (
            <button
              key={cat.slug}
              type="button"
              className="bp-slot open"
              data-state="open"
              disabled={busy || complete}
              aria-pressed={pendingSlot === i}
              onClick={(event) => { if (event.detail < 2) dispatch({ t: "place", s: i }); }}
              aria-label={`Put ${country.displayName} on ${label}`}
            >
              <StatIcon slug={cat.slug} size={22} />
              <span className="bp-lbl">{label}</span>
            </button>
          );
        })}
      </div>

      <p className="bp-line t-body">
        {complete ? (
          "All six placed."
        ) : (
          <>
            Tap a stat to place the country.<span className="bp-keys"> Keys 1 to {PICK_COUNT}.</span>
          </>
        )}
      </p>

      <p className="sr-only" aria-live="polite">
        {moved && lastCountry && lastRank !== null && lastSlot >= 0
          ? `${lastCountry.displayName} is number ${lastRank} of ${cfg.of[lastSlot]} on ${statWording(cfg.categories[lastSlot].slug)}. ${tierFor(lastRank, cfg.of[lastSlot])}.`
          : ""}
      </p>
    </div>
  );
}
