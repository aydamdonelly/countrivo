import type { Codec } from "@/games/types";
import type { BlindPickAction } from "./module";

/*
 * The resume log for the 6 x 6 board: the version prefix `b6.`, then one digit per
 * placement (the slot, 0 to 5) and `s` once the last flip was shown. Worst case
 * `b6.012345s`, 10 bytes. A log from the old eight-pick rules (`p3p1u...`) has no prefix,
 * so `dec` throws and the play page drops the cookie instead of replaying it.
 */
const PREFIX = "b6.";
const MAX_SLOT = 5;

export const codec: Codec<BlindPickAction> = {
  enc(log) {
    return (
      PREFIX +
      log
        .map((a) => {
          switch (a.t) {
            case "place":
              return String(a.s);
            case "seen":
              return "s";
          }
        })
        .join("")
    );
  },

  dec(s) {
    if (!s.startsWith(PREFIX)) throw new Error("not a 6 x 6 Blind Pick log");
    const out: BlindPickAction[] = [];
    const body = s.slice(PREFIX.length);
    for (let i = 0; i < body.length; i += 1) {
      const ch = body[i];
      if (/^[0-9]$/.test(ch)) {
        const slot = Number(ch);
        if (slot > MAX_SLOT) throw new Error(`bad slot at ${i}`);
        out.push({ t: "place", s: slot });
      } else if (ch === "s") {
        out.push({ t: "seen" });
      } else {
        throw new Error(`bad token ${ch} at ${i}`);
      }
    }
    return out;
  },
};
