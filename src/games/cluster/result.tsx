"use client";

import { getCountryByIso3 } from "@/lib/data/countries";
import { CLUSTER_GROUP_COUNT, type ClusterState } from "@/lib/game-logic/cluster/engine";
import { Flag } from "@/ui/flag";
import type { ResultProps } from "@/games/types";
import { grade, groupsInPlayOrder } from "./module";

/** The four countries of a group, each as a flag beside its name; wraps rather than clips. */
function Members({ members }: { members: readonly string[] }) {
  return (
    <span className="t-meta" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 12px", marginTop: "4px" }}>
      {members.map((iso3) => {
        const country = getCountryByIso3(iso3);
        return (
          <span key={iso3} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Flag iso2={country?.iso2 ?? ""} size="xs" alt="" />
            {country?.displayName ?? iso3}
          </span>
        );
      })}
    </span>
  );
}

/**
 * The rows under the result panel (blueprint 8.8): the grade word with the two facts, then
 * one row per group in the order the player met them, each carrying its trait, whether it
 * was solved or missed, and its four countries by flag and name.
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
        {groupsInPlayOrder(state).map((group) => {
          const found = state.solvedGroupIds.includes(group.id);
          return (
            <div key={group.id} className="rrow" style={{ gridTemplateColumns: "1fr auto", alignItems: "start" }}>
              <span className="nm" style={{ whiteSpace: "normal" }}>
                {group.trait}
                <Members members={group.members} />
              </span>
              <b className={found ? "v t-meta mute" : "v t-meta bad"}>{found ? "solved" : "missed"}</b>
            </div>
          );
        })}
      </div>
    </div>
  );
}
