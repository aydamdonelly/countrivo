/*
 * The resume log (blueprint 8.3): one letter per call, `h` higher and `l` lower. The
 * reveal's `advance` is a ui action and never reaches the log; replay applies it after
 * every decoded call, so a resumed board lands on the next pair with no timer to wait on.
 * Worst case: 80 rounds, 80 chars, far inside the 900-byte cookie cap.
 */
import type { Codec } from "@/games/types";
import type { HoLAction } from "./module";

export const codec: Codec<HoLAction> = {
  enc(log) {
    let out = "";
    for (const a of log) if (a.t === "guess") out += a.c === "higher" ? "h" : "l";
    return out;
  },
  dec(s) {
    return s.split("").map((ch) => {
      if (ch === "h") return { t: "guess", c: "higher" } as HoLAction;
      if (ch === "l") return { t: "guess", c: "lower" } as HoLAction;
      throw new Error(`bad call ${ch}`);
    });
  },
};
