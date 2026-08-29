"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { getCountryByIso3 } from "@/lib/data/countries";
import { CLUSTER_GROUP_SIZE, type ClusterState } from "@/lib/game-logic/cluster/engine";
import { Button } from "@/ui/button";
import { GroupBand, Tile, type GroupId } from "@/ui/tile";
import type { BoardProps } from "@/games/types";
import { TileGrid } from "@/games/_shared/tile-grid";
import { groupsInPlayOrder, solvedMembers, type ClusterAction } from "./module";

/** The four countries of a group as the band draws them. */
function bandMembers(members: readonly string[]): { iso2: string; name: string }[] {
  return members.map((iso3) => {
    const country = getCountryByIso3(iso3);
    return { iso2: country?.iso2 ?? "", name: country?.displayName ?? iso3 };
  });
}

/*
 * A tile is 83 px wide on a 390 px phone and holds two clamped lines of type. 232 of the 243
 * country names fit at 11 px; the nine below were measured in the browser at 375 px, the
 * narrowest phone, so they stay whole on every screen: a name that ends in an ellipsis is a
 * cut, and a cut reads as broken. The two that cannot fit at any readable size drop their
 * trailing clause; both short forms name exactly one country, and the full name stays on the
 * band, on the result rows and in the tile's title.
 */
const SHORT_NAME: Record<string, string> = {
  "Saint Helena, Ascension and Tristan da Cunha": "Saint Helena",
  "Saint Vincent and the Grenadines": "Saint Vincent",
};

const TIGHT_NAME: Record<string, string> = {
  "British Virgin Islands": "10px",
  "São Tomé and Príncipe": "10px",
  "Svalbard and Jan Mayen": "10px",
  "Saint Pierre and Miquelon": "9px",
  "United States Virgin Islands": "9px",
  "Central African Republic": "8px",
  "Cocos (Keeling) Islands": "8px",
  "Northern Mariana Islands": "8px",
  "Turks and Caicos Islands": "8px",
};

/** The label a tile carries, and the size it needs. `undefined` keeps the 11 px default. */
function tileLabel(name: string): { label: string; size: string | undefined } {
  const label = SHORT_NAME[name] ?? name;
  const measured = TIGHT_NAME[label];
  // Data can grow a longer name than the measured set; anything past the longest name that
  // fits today steps down rather than risking the clamp.
  const size = measured ?? (label.length > 24 ? "8px" : undefined);
  return { label, size };
}

const SLIDE_MS = 260;
const SLIDE_EASE = "cubic-bezier(0.2, 0, 0, 1)";

function slide(el: HTMLElement, dx: number, dy: number): void {
  if (typeof el.animate !== "function") return;
  el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0px, 0px)" }], { duration: SLIDE_MS, easing: SLIDE_EASE });
}

function reducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Cluster (blueprint 8.8): one instruction line, the bands you have cracked, the 4x4 grid of
 * what is left, Submit and Deselect. A solved group collapses into a band and the tiles that
 * survive glide to their new places (6.3.7); every one of those moves is a transform on
 * content that is already on screen, so a board with no animation frame is still complete.
 * When the game is over the grid is gone and all four bands stand revealed.
 */
export function Board({ state, dispatch, busy }: BoardProps<ClusterState, ClusterAction>) {
  const live = state.phase === "playing";
  const solved = solvedMembers(state);
  const openTiles = state.tiles.filter((tile) => !solved.has(tile.iso3));
  const picked = state.selected.length;
  const bands = live
    ? state.solvedGroupIds.map((id) => state.groups.find((g) => g.id === id)).filter((g) => g != null)
    : groupsInPlayOrder(state);

  const stackRef = useRef<HTMLDivElement | null>(null);
  const lastRects = useRef<Map<string, DOMRect>>(new Map());
  const lastBands = useRef<Set<number>>(new Set());
  const lastGuesses = useRef(state.guesses.length);

  // FLIP: the rects of the previous commit are still in `lastRects` when this runs, so the
  // new band starts where its four tiles were and the survivors start where they sat.
  useLayoutEffect(() => {
    const stack = stackRef.current;
    if (!stack) return;
    const animate = !reducedMotion();
    const rects = new Map<string, DOMRect>();
    const tiles: { iso3: string; el: HTMLElement; rect: DOMRect }[] = [];
    stack.querySelectorAll<HTMLElement>("[data-iso3]").forEach((el) => {
      const iso3 = el.dataset.iso3;
      if (!iso3) return;
      const rect = el.getBoundingClientRect();
      rects.set(iso3, rect);
      tiles.push({ iso3, el, rect });
    });

    if (animate) {
      stack.querySelectorAll<HTMLElement>("[data-band]").forEach((el) => {
        const id = Number(el.dataset.band);
        if (Number.isNaN(id) || lastBands.current.has(id)) return;
        const group = state.groups.find((g) => g.id === id);
        const from = group?.members.map((iso3) => lastRects.current.get(iso3)) ?? [];
        if (from.length === 0 || from.some((rect) => rect == null)) return;
        const tops = from.map((rect) => (rect as DOMRect).top);
        const bottoms = from.map((rect) => (rect as DOMRect).bottom);
        const wasCentre = (Math.min(...tops) + Math.max(...bottoms)) / 2;
        const now = el.getBoundingClientRect();
        const dy = wasCentre - (now.top + now.height / 2);
        if (Math.abs(dy) > 1) slide(el, 0, dy);
      });
      for (const tile of tiles) {
        const was = lastRects.current.get(tile.iso3);
        if (!was) continue;
        const dx = was.left - tile.rect.left;
        const dy = was.top - tile.rect.top;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) slide(tile.el, dx, dy);
      }
    }

    lastRects.current = rects;
    lastBands.current = new Set(state.solvedGroupIds);
  }, [state]);

  // A submit disables its own button, which drops focus to the document. Keyboard players
  // get it back on the grid; a mouse click leaves no ring, because the focus is programmatic.
  useEffect(() => {
    if (state.guesses.length === lastGuesses.current) return;
    lastGuesses.current = state.guesses.length;
    if (state.phase !== "playing") return;
    if (document.activeElement && document.activeElement !== document.body) return;
    stackRef.current?.querySelector<HTMLButtonElement>("button.tile")?.focus();
  }, [state.guesses.length, state.phase]);

  return (
    <div className="play-stack" ref={stackRef}>
      {live ? <p className="t-body play-line play-center">Tap four countries that share a connection.</p> : null}
      {bands.map((group) => (
        // The band sits a layer above the grid, so the tiles that survive a solve slide
        // under it instead of over its label.
        <div key={group.id} data-band={group.id} style={{ position: "relative", zIndex: 1 }}>
          <GroupBand
            group={group.id as GroupId}
            trait={group.trait}
            members={bandMembers(group.members)}
            // Only the groups that got away are called out: on a clean board the score
            // says 4/4 and four "solved" labels would be four dead words.
            status={live || state.solvedGroupIds.includes(group.id) ? undefined : "missed"}
          />
        </div>
      ))}
      {live ? (
        <TileGrid>
          {openTiles.map((tile) => {
            const { label, size } = tileLabel(tile.displayName);
            return (
              // min-width 0 keeps every column an exact quarter: a `1fr` track is
              // minmax(auto, 1fr), so one long word would otherwise widen its column and
              // squeeze the other three.
              <div key={tile.iso3} data-iso3={tile.iso3} style={{ minWidth: 0 }}>
                <Tile
                  iso2={tile.iso2}
                  name={label}
                  selected={state.selected.includes(tile.iso3)}
                  disabled={busy}
                  title={label === tile.displayName ? undefined : tile.displayName}
                  style={size ? { fontSize: size } : undefined}
                  onClick={() => dispatch({ t: "toggle", iso3: tile.iso3 })}
                />
              </div>
            );
          })}
        </TileGrid>
      ) : null}
      {live ? (
        <div className="play-actions under-grid">
          <Button variant="ink" onClick={() => dispatch({ t: "submit" })} disabled={busy || picked < CLUSTER_GROUP_SIZE}>
            {picked < CLUSTER_GROUP_SIZE ? `Submit ${picked}/${CLUSTER_GROUP_SIZE}` : "Submit"}
          </Button>
          <Button variant="quiet" onClick={() => dispatch({ t: "clear" })} disabled={busy || picked === 0}>
            Deselect
          </Button>
        </div>
      ) : null}
    </div>
  );
}
