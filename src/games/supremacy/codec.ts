import type { Codec } from "@/games/types";
import type { SupremacyAction } from "./module";

/** Practice only: nothing is persisted (blueprint 8.3). */
export const codec: Codec<SupremacyAction> = {
  enc() {
    return "";
  },
  dec(s) {
    if (s) throw new Error("supremacy has no resume log");
    return [];
  },
};
