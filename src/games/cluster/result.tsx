"use client";

import { getCountryByIso3 } from "@/lib/data/countries";
import { CLUSTER_GROUP_COUNT, type ClusterState } from "@/lib/game-logic/cluster/engine";
import type { ResultProps } from "@/games/types";
import { grade } from "./module";

/**
 * The rows under the result panel (blueprint 8.8): the grade word with the two facts, then
 * one row per group. The finished board directly above keeps the coloured bands with the
 * flags, so these rows carry what the bands cannot: the four countries by name.
 */
export function Result({ state }: ResultProps<ClusterState>) {
  const solved = state.solvedGroupIds.length;
  return (
    <div className="play-stack">
      <div className="rhead">
        <b className="t-h3">{grade(state)}</b>
        <span className="rfacts t-body">
          groups{" "}
          <b className="num">
            {solved}/{CLUSTER_GROUP_COUNT}
          </b>{" "}
          · mistakes <b className="num">{state.mistakes}</b>
        </span>
      </div>
      <div className="rrows t-row">
        {state.groups.map((group) => {
          const found = state.solvedGroupIds.includes(group.id);
          const names = group.members.map((iso3) => getCountryByIso3(iso3)?.displayName ?? iso3);
          return (
            <div key={group.id} className="rrow" style={{ gridTemplateColumns: "1fr auto", alignItems: "start" }}>
              <span className="nm" style={{ whiteSpace: "normal" }}>
                {group.trait}
                <small className="t-meta">{names.join(" · ")}</small>
              </span>
              {found ? null : <b className="v t-meta bad">missed</b>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
