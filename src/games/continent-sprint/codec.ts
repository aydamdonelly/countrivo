import type { Codec } from "@/games/types";
import type { SprintAction } from "./module";

/** Practice only: nothing is persisted (blueprint 8.3). */
export const codec: Codec<SprintAction> = {
  enc() {
    return "";
  },
  dec(s) {
    if (s) throw new Error("continent-sprint has no resume log");
    return [];
  },
};
