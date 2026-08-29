import type { Codec } from "@/games/types";
import type { OddAction } from "./module";

/** One digit per answer plus `n` per advance (blueprint 8.3); 10 chars at most. */
export const codec: Codec<OddAction> = {
  enc(log) {
    return log.map((a) => (a.t === "answer" ? String(a.i) : "n")).join("");
  },
  dec(s) {
    return s.split("").map((ch) => {
      if (ch === "n") return { t: "next" } as OddAction;
      const i = Number(ch);
      if (!Number.isInteger(i) || i < 0 || i > 3) throw new Error(`bad answer ${ch}`);
      return { t: "answer", i } as OddAction;
    });
  },
};
