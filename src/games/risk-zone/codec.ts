import type { Codec } from "@/games/types";
import type { RiskAction } from "./module";

/**
 * The resume log (blueprint 8.3): one letter per action, `h` and `l` for the two calls,
 * `b` bank, `p` push, `n` next chain. A full run is five chains of at most seven calls with
 * a push between them plus the close, about 75 characters, far inside the 900-byte cookie.
 * A token the reducer does not know cannot appear, so anything else is a broken log and
 * throws: the page then drops the cookie and deals a fresh board.
 */
export const codec: Codec<RiskAction> = {
  enc(log) {
    return log
      .map((a) => {
        if (a.t === "guess") return a.c === "higher" ? "h" : "l";
        if (a.t === "bank") return "b";
        if (a.t === "push") return "p";
        return "n";
      })
      .join("");
  },
  dec(s) {
    return Array.from(s, (ch): RiskAction => {
      if (ch === "h") return { t: "guess", c: "higher" };
      if (ch === "l") return { t: "guess", c: "lower" };
      if (ch === "b") return { t: "bank" };
      if (ch === "p") return { t: "push" };
      if (ch === "n") return { t: "next" };
      throw new Error(`risk-zone: bad log token ${ch}`);
    });
  },
};
