import type { Codec } from "@/games/types";
import type { SpeedAction } from "./module";

/** Practice only, and the clock is wall-clock: nothing is persisted (blueprint 8.3). */
export const codec: Codec<SpeedAction> = {
  enc() {
    return "";
  },
  dec(s) {
    if (s) throw new Error("speed-flags has no resume log");
    return [];
  },
};
