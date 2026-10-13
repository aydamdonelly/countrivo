import type { Codec } from "@/games/types";
import type { GuesserAction } from "./module";

/**
 * The resume log (blueprint 8.3), version 2 (the October 2026 ruler rules): `v2`, then
 * `l{step};` per lock with the ruler step in base 36, and `n` per advance. Five rounds stay
 * under 30 bytes. A version 1 cookie (`g{number};`, typed guesses) does not start with `v2`,
 * so `dec` throws and the play page discards it instead of replaying it into the new reducer.
 */
const VERSION = "v2";
const STEP = /^[0-9a-z]{1,3}$/;

export const codec: Codec<GuesserAction> = {
  enc(log) {
    return VERSION + log.map((a) => (a.t === "lock" ? `l${a.i.toString(36)};` : "n")).join("");
  },
  dec(s) {
    if (s === "") return [];
    if (!s.startsWith(VERSION)) throw new Error("stat-guesser: old or unknown log version");
    const out: GuesserAction[] = [];
    let i = VERSION.length;
    while (i < s.length) {
      if (s[i] === "n") {
        out.push({ t: "next" });
        i += 1;
        continue;
      }
      if (s[i] !== "l") throw new Error(`bad token ${s[i]} at ${i}`);
      const end = s.indexOf(";", i);
      if (end < 0) throw new Error("unterminated lock");
      const raw = s.slice(i + 1, end);
      if (!STEP.test(raw)) throw new Error(`bad step ${raw}`);
      out.push({ t: "lock", i: parseInt(raw, 36) });
      i = end + 1;
    }
    return out;
  },
};
