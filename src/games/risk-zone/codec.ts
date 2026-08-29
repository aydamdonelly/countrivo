import type { Codec } from "@/games/types";
import type { RiskAction } from "./module";

/** `h` `l` `b` `p` `n` (blueprint 8.3), about 80 chars. */
export const codec: Codec<RiskAction> = {
  enc(log) {
    return log.map((a) => (a.t === "guess" ? (a.c === "higher" ? "h" : "l") : a.t === "bank" ? "b" : a.t === "push" ? "p" : "n")).join("");
  },
  dec(s) {
    return s.split("").map((ch): RiskAction => {
      if (ch === "h") return { t: "guess", c: "higher" };
      if (ch === "l") return { t: "guess", c: "lower" };
      if (ch === "b") return { t: "bank" };
      if (ch === "p") return { t: "push" };
      if (ch === "n") return { t: "next" };
      throw new Error(`bad token ${ch}`);
    });
  },
};
