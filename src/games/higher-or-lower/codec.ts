/*
 * The resume log (blueprint 8.3): the version mark `2`, then one letter per call, `h` higher
 * and `l` lower. The reveal's `advance` and the deal lock's `ready` are ui actions and never
 * reach the log; replay applies `advance` after every decoded call, so a resumed board lands
 * on the next pair with no timer to wait on. A daily is ten calls, eleven characters.
 *
 * The mark exists because the October 2026 rules changed what a call means (a chain of ten
 * calls instead of a sudden-death streak): a log written under the old rules has no mark,
 * fails `dec` and is discarded instead of replaying into the new board.
 */
import type { Codec } from "@/games/types";
import type { HoLAction } from "./module";

const VERSION = "2";

export const codec: Codec<HoLAction> = {
  enc(log) {
    let out = VERSION;
    for (const a of log) if (a.t === "guess") out += a.c === "higher" ? "h" : "l";
    return out;
  },
  dec(s) {
    if (!s.startsWith(VERSION)) throw new Error("higher-or-lower: log from the old rules");
    return s
      .slice(VERSION.length)
      .split("")
      .map((ch): HoLAction => {
        if (ch === "h") return { t: "guess", c: "higher" };
        if (ch === "l") return { t: "guess", c: "lower" };
        throw new Error(`bad call ${ch}`);
      });
  },
};
