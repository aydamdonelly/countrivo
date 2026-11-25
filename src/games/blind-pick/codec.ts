import type { Codec } from "@/games/types";
import type { BlindPickAction } from "./module";

/** Append-only moves: digits for slots, U for the one undo, S for the final reveal. */
const PREFIX = "b8.";

export const codec: Codec<BlindPickAction> = {
  enc(log) {
    return (
      PREFIX +
      log
        .map((a) => {
          switch (a.t) {
            case "place":
              if (!Number.isInteger(a.s) || a.s < 0 || a.s > 7) throw new Error("invalid slot");
              return String(a.s);
            case "undo":
              return "u";
            case "seen":
              return "s";
            default:
              throw new Error("invalid action");
          }
        })
        .join("")
    );
  },

  dec(s) {
    const legacy = s.startsWith("b6.");
    if (!legacy && !s.startsWith(PREFIX)) throw new Error("not a Blind Pick log");
    const out: BlindPickAction[] = [];
    const body = s.slice(PREFIX.length);
    for (let i = 0; i < body.length; i += 1) {
      const ch = body[i];
      if (/^[0-9]$/.test(ch)) {
        const slot = Number(ch);
        if (slot > (legacy ? 5 : 7)) throw new Error(`bad slot at ${i}`);
        out.push({ t: "place", s: slot });
      } else if (ch === "s") {
        out.push({ t: "seen" });
      } else if (ch === "u" && !legacy) {
        out.push({ t: "undo" });
      } else {
        throw new Error(`bad token ${ch} at ${i}`);
      }
    }
    return out;
  },
};
