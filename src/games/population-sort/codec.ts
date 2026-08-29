import type { Codec } from "@/games/types";
import type { SortAction } from "./module";

/** `o{6 digits}` the current order (rewritten: only the last before a submit survives), `s` submit (blueprint 8.3). */
export const codec: Codec<SortAction> = {
  enc(log) {
    let out = "";
    let last: number[] | null = null;
    for (const a of log) {
      if (a.t === "order") last = a.perm;
      else if (a.t === "submit") {
        if (last) out += `o${last.join("")}`;
        out += "s";
        last = null;
      }
    }
    if (last) out += `o${last.join("")}`;
    return out;
  },
  dec(s) {
    const out: SortAction[] = [];
    let i = 0;
    while (i < s.length) {
      if (s[i] === "s") {
        out.push({ t: "submit" });
        i++;
      } else if (s[i] === "o") {
        const digits = s.slice(i + 1, i + 7);
        if (!/^[0-5]{6}$/.test(digits)) throw new Error(`bad order at ${i}`);
        out.push({ t: "order", perm: digits.split("").map(Number) });
        i += 7;
      } else throw new Error(`bad token ${s[i]} at ${i}`);
    }
    return out;
  },
};
