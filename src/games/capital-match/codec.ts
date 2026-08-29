import type { Codec } from "@/games/types";
import type { CapitalAction } from "./module";

/** One digit per answer (blueprint 8.3); the advance is never persisted. */
export const codec: Codec<CapitalAction> = {
  enc(log) {
    return log.filter((a) => a.t === "answer").map((a) => (a.t === "answer" ? String(a.i) : "")).join("");
  },
  dec(s) {
    return s.split("").map((ch) => {
      const i = Number(ch);
      if (!Number.isInteger(i) || i < 0 || i > 3) throw new Error(`bad answer ${ch}`);
      return { t: "answer", i } as CapitalAction;
    });
  },
};
