import type { Codec } from "@/games/types";
import type { ClusterAction } from "./module";

/**
 * `q{ISO}{ISO}{ISO}{ISO}` per submitted quartet, then `S{ISO...}` for the current selection
 * (rewritten, blueprint 8.3): 8 submits + a selection = 117 chars worst case. `dec` expands
 * a quartet into four toggles and a submit, the selection into toggles.
 */
export const codec: Codec<ClusterAction> = {
  enc(log) {
    let out = "";
    let sel: string[] = [];
    for (const a of log) {
      if (a.t === "toggle") sel = sel.includes(a.iso3) ? sel.filter((x) => x !== a.iso3) : [...sel, a.iso3];
      else if (a.t === "submit") {
        if (sel.length === 4) out += `q${sel.join("")}`;
        sel = [];
      } else if (a.t === "clear") sel = [];
    }
    if (sel.length) out += `S${sel.join("")}`;
    return out;
  },
  dec(s) {
    const out: ClusterAction[] = [];
    let i = 0;
    const iso = (at: number) => {
      const code = s.slice(at, at + 3);
      if (!/^[A-Z]{3}$/.test(code)) throw new Error(`bad iso3 at ${at}`);
      return code;
    };
    while (i < s.length) {
      if (s[i] === "q") {
        for (let k = 0; k < 4; k++) out.push({ t: "toggle", iso3: iso(i + 1 + k * 3) });
        out.push({ t: "submit" });
        i += 13;
      } else if (s[i] === "S") {
        i += 1;
        while (i < s.length && s[i] !== "q" && s[i] !== "S") {
          out.push({ t: "toggle", iso3: iso(i) });
          i += 3;
        }
      } else throw new Error(`bad token ${s[i]} at ${i}`);
    }
    return out;
  },
};
