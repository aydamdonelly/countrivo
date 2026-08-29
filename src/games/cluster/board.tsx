"use client";

import { getCountryByIso3 } from "@/lib/data/countries";
import type { ClusterState } from "@/lib/game-logic/cluster/engine";
import { Button } from "@/ui/button";
import { GroupBand, Tile, type GroupId } from "@/ui/tile";
import type { BoardProps } from "@/games/types";
import { TileGrid } from "@/games/_shared/tile-grid";
import type { ClusterAction } from "./module";

function members(s: ClusterState, id: number) {
  const g = s.groups.find((x) => x.id === id);
  return (g?.members ?? []).map((iso3) => ({ iso2: getCountryByIso3(iso3)?.iso2 ?? "", name: getCountryByIso3(iso3)?.displayName ?? iso3 }));
}

/** Cluster (blueprint 8.8): the solved bands above a 4x4 grid, Submit and Deselect. */
export function Board({ state, dispatch, busy }: BoardProps<ClusterState, ClusterAction>) {
  const solved = new Set(state.solvedGroupIds.flatMap((id) => state.groups.find((g) => g.id === id)?.members ?? []));
  const live = state.phase === "playing";
  const n = state.selected.length;
  return (
    <div className="play-stack">
      <p className="t-body play-line play-center">Tap four countries that share a connection.</p>
      {state.solvedGroupIds.map((id) => {
        const g = state.groups.find((x) => x.id === id);
        return g ? <GroupBand key={id} group={id as GroupId} trait={g.trait} members={members(state, id)} /> : null;
      })}
      {live ? (
        <TileGrid>
          {state.tiles
            .filter((t) => !solved.has(t.iso3))
            .map((t) => (
              <Tile key={t.iso3} iso2={t.iso2} name={t.displayName} selected={state.selected.includes(t.iso3)} onClick={() => dispatch({ t: "toggle", iso3: t.iso3 })} disabled={busy} />
            ))}
        </TileGrid>
      ) : null}
      {live ? (
        <div className="play-actions">
          <Button variant="ink" onClick={() => dispatch({ t: "submit" })} disabled={busy || n < 4}>
            {n < 4 ? `Submit ${n}/4` : "Submit"}
          </Button>
          <Button variant="quiet" onClick={() => dispatch({ t: "clear", ui: true })} disabled={n === 0}>
            Deselect
          </Button>
        </div>
      ) : null}
    </div>
  );
}
