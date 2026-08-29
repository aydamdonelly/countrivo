"use server";

import { searchUsers } from "@/app/actions/friends";
import { getSilhouettePath, iso2ToIso3 } from "@/lib/silhouettes";

export interface FoundPlayer {
  id: string;
  username: string;
  displayName: string | null;
  /** The silhouette path, resolved here: the 96 KB JSON never reaches the browser. */
  crest: string | null;
}

/**
 * The friends search (blueprint 7.14). A thin wrapper over the kept `searchUsers` contract
 * that resolves each result's crest on the server, because `silhouettes.json` is server only
 * (blueprint 5.2) and a search row wears a crest, never a flag and never an initial.
 */
export async function findPlayers(query: string): Promise<FoundPlayer[]> {
  const profiles = await searchUsers(query);
  return profiles.map((p) => ({
    id: p.id,
    username: p.username,
    displayName: p.displayName,
    crest: getSilhouettePath(iso2ToIso3(p.countryCode)),
  }));
}
