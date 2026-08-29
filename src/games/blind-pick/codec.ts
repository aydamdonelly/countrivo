import type { Codec } from "@/games/types";
import type { BlindPickAction } from "./module";

/*
 * The resume log (blueprint 8.3): `p{c}` a pick on category 0 to 7, `u` the one undo, `s` the
 * reveal acknowledged. Worst case is eight picks, the undo, the re-pick and the reveal token:
 * 20 characters, far inside the 900-byte cookie cap. `dec` throws on anything it cannot read,
 * and the play page then drops the cookie rather than replaying nonsense.
 */
const MAX_CATEGORY = 7;

export const codec: Codec<BlindPickAction> = {
  enc(log) {
    return log
      .map((a) => {
        switch (a.t) {
          case "pick":
            return `p${a.c}`;
          case "undo":
            return "u";
          case "seen":
            return "s";
        }
      })
      .join("");
  },

  dec(s) {
    const out: BlindPickAction[] = [];
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
