import type { Codec } from "@/games/types";
import type { DraftAction } from "./module";

/*
 * The resume log (blueprint 8.3): `p{c}` a pick on category 0 to 7, `u` the one undo, `s` the
 * reveal acknowledged. Worst case 8 picks plus an undo plus the reveal token = 18 characters,
 * far inside the 900-byte cookie cap. `dec` throws on anything it cannot read, and the play
 * page then drops the cookie rather than replaying nonsense.
 */
const MAX_CATEGORY = 7;

export const codec: Codec<DraftAction> = {
  enc(log) {
    return log.map((a) => (a.t === "pick" ? `p${a.c}` : a.t === "undo" ? "u" : "s")).join("");
  },

  dec(s) {
    const out: DraftAction[] = [];
    for (let i = 0; i < s.length; i += 1) {
      const ch = s[i];
      if (ch === "p") {
        const digit = s[i + 1];
        if (digit === undefined || !/^[0-9]$/.test(digit)) throw new Error(`bad pick at ${i}`);
        const c = Number(digit);
        if (c > MAX_CATEGORY) throw new Error(`bad pick at ${i}`);
        out.push({ t: "pick", c });
        i += 1;
      } else if (ch === "u") {
        out.push({ t: "undo" });
      } else if (ch === "s") {
        out.push({ t: "seen" });
      } else {
        throw new Error(`bad token ${ch} at ${i}`);
      }
    }
    return out;
  },
};
