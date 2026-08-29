import type { Codec } from "@/games/types";
import type { ExampleAction } from "./module";

/**
 * The reference codec (blueprint 8.3): one digit per answer, nothing else. `enc` takes the
 * whole persisted list so a module can fold it; `dec` throws on a log it cannot read, and the
 * play page then discards the cookie instead of replaying nonsense.
 */
export const codec: Codec<ExampleAction> = {
  enc(log) {
    return log.map((a) => (a.t === "answer" ? String(a.i) : "")).join("");
  },
  dec(s) {
    return s.split("").map((ch) => {
      const i = Number(ch);
      if (!Number.isInteger(i) || i < 0 || i > 3) throw new Error(`bad answer ${ch}`);
      return { t: "answer", i } as ExampleAction;
    });
  },
};
