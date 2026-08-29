import type { Codec } from "@/games/types";
import type { BorderlineAction } from "./module";

/** Practice only: nothing is persisted (blueprint 8.3). */
export const codec: Codec<BorderlineAction> = {
  enc() {
    return "";
  },
  dec(s) {
    if (s) throw new Error("borderline has no resume log");
    return [];
  },
};
