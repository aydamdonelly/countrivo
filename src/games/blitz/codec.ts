import type { Codec } from "@/games/types";
import type { BlitzAction } from "./module";

/** Practice only: nothing is persisted (blueprint 8.3). */
export const codec: Codec<BlitzAction> = {
  enc() {
    return "";
  },
  dec(s) {
    if (s) throw new Error("blitz has no resume log");
    return [];
  },
};
