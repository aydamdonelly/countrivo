import type { Codec } from "@/games/types";
import { CLUSTER_GROUP_SIZE } from "@/lib/game-logic/cluster/engine";
import type { ClusterAction } from "./module";

/*
 * The resume log (blueprint 8.3): a state snapshot, not the raw event stream. Every
 * submitted quartet is one `q{ISO}{ISO}{ISO}{ISO}` token (13 chars) and the selection still
 * on the board is one trailing `S{ISO...}` token (at most 13). A board runs to at most
 * seven quartets (four groups plus three mistakes, or three plus four), so the worst log is
 * 104 chars, far under the 900-byte cookie cap. `dec` expands a quartet into four toggles
 * and a submit and the selection into toggles, which is exactly what the reducer replays.
 */
const ISO3 = /^[A-Z]{3}$/;
const QUARTET_LEN = 1 + CLUSTER_GROUP_SIZE * 3;

export const codec: Codec<ClusterAction> = {
  enc(log) {
    let out = "";
    let selected: string[] = [];
    for (const action of log) {
      if (action.t === "toggle") {
        // Mirrors toggleTile: a second tap removes, a fifth tile is refused.
        if (selected.includes(action.iso3)) selected = selected.filter((iso3) => iso3 !== action.iso3);
        else if (selected.length < CLUSTER_GROUP_SIZE) selected = [...selected, action.iso3];
      } else if (action.t === "clear") {
        selected = [];
      } else if (action.t === "submit" && selected.length === CLUSTER_GROUP_SIZE) {
        out += `q${selected.join("")}`;
        selected = [];
      }
    }
    if (selected.length > 0) out += `S${selected.join("")}`;
    return out;
  },
  dec(s) {
    const out: ClusterAction[] = [];
    let i = 0;
    const iso3 = (at: number): string => {
      const code = s.slice(at, at + 3);
      if (!ISO3.test(code)) throw new Error(`cluster log: no iso3 code at ${at}`);
      return code;
    };
    while (i < s.length) {
      const tag = s[i];
      if (tag === "q") {
        for (let k = 0; k < CLUSTER_GROUP_SIZE; k += 1) out.push({ t: "toggle", iso3: iso3(i + 1 + k * 3) });
        out.push({ t: "submit" });
        i += QUARTET_LEN;
      } else if (tag === "S") {
        // The selection token is always last and holds at most four codes, so anything
        // after it is a corrupt log; the page then drops the cookie and deals a fresh board.
        i += 1;
        for (let k = 0; k < CLUSTER_GROUP_SIZE && i < s.length; k += 1) {
          out.push({ t: "toggle", iso3: iso3(i) });
          i += 3;
        }
        if (i !== s.length) throw new Error(`cluster log: trailing data at ${i}`);
      } else {
        throw new Error(`cluster log: unknown token ${tag} at ${i}`);
      }
    }
    return out;
  },
};
