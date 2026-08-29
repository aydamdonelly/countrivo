import type { Codec } from "@/games/types";
import type { DraftAction } from "./module";

/** `p{c}` pick (category index 0-7), `u` undo, `s` seen (blueprint 8.3): 8 picks + 1 undo + 1 = 20 chars worst case. */
export const codec: Codec<DraftAction> = {
  enc(log) {
    return log.map((a) => (a.t === "pick" ? `p${a.c}` : a.t === "undo" ? "u" : "s")).join("");
  },
  dec(s) {
    const out: DraftAction[] = [];
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === "p") {
        const c = Number(s[i + 1]);
        if (!Number.isInteger(c) || c < 0 || c > 7) throw new Error(`bad pick at ${i}`);
        out.push({ t: "pick", c });
        i++;
      } else if (ch === "u") out.push({ t: "undo" });
      else if (ch === "s") out.push({ t: "seen" });
      else throw new Error(`bad token ${ch} at ${i}`);
    }
    return out;
  },
};
