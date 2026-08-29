"use client";

import { getCountryByIso3 } from "@/lib/data/countries";
import type { ClusterState } from "@/lib/game-logic/cluster/engine";
import { GroupBand, type GroupId } from "@/ui/tile";
import type { ResultProps } from "@/games/types";

/** Four bands: the trait, solved or missed, the members. */
export function Result({ state }: ResultProps<ClusterState>) {
  return (
    <div className="play-stack">
      {state.groups.map((g) => (
        <GroupBand key={g.id} group={g.id as GroupId} trait={g.trait} status={state.solvedGroupIds.includes(g.id) ? "solved" : "missed"} members={g.members.map((iso3) => ({ iso2: getCountryByIso3(iso3)?.iso2 ?? "", name: getCountryByIso3(iso3)?.displayName ?? iso3 }))} />
      ))}
    </div>
  );
}
