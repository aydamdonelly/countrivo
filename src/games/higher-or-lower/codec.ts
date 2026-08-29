import type { Codec } from "@/games/types";
import type { HoLAction } from "./module";

/** `h` / `l` per call (blueprint 8.3), 80 chars worst case; the advance is never persisted. */
export const codec: Codec<HoLAction> = {
  enc(log) {
    return log.filter((a) => a.t === "guess").map((a) => (a.t === "guess" && a.c === "higher" ? "h" : "l")).join("");
  },
  dec(s) {
    return s.split("").map((ch) => {
      if (ch === "h") return { t: "guess", c: "higher" } as HoLAction;
      if (ch === "l") return { t: "guess", c: "lower" } as HoLAction;
      throw new Error(`bad call ${ch}`);
    });
  },
};
