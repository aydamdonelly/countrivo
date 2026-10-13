import type { Codec } from "@/games/types";
import type { SpeedAction } from "./module";

/**
 * Practice only, and the clock is wall-clock: nothing is persisted (blueprint 8.3). The log
 * is always empty, so any non-empty cookie (the 20-second rules or anything else) throws
 * here and the page discards it instead of replaying it into the 30-second reducer.
 */
export const codec: Codec<SpeedAction> = {
  enc() {
    return "";
  },
  dec(s) {
    if (s) throw new Error("speed-flags has no resume log");
    return [];
  },
};
