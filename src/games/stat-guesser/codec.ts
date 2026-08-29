import type { Codec } from "@/games/types";
import type { GuesserAction } from "./module";

/**
 * The resume log (blueprint 8.3): `g{number};` per guess, `n` per advance. Five rounds of a
 * typed number stay far under the 900-byte cookie cap (a nine-figure guess costs 11 chars).
 * `dec` throws on anything it cannot read; the play page then discards the cookie.
 */
const NUMBER = /^[0-9]+(\.[0-9]+)?(e[+-]?[0-9]+)?$/;
const MAX_DIGITS = 24;

export const codec: Codec<GuesserAction> = {
  enc(log) {
    return log.map((a) => (a.t === "guess" ? `g${a.v};` : "n")).join("");
  },
  dec(s) {
    const out: GuesserAction[] = [];
    let i = 0;
    while (i < s.length) {
      if (s[i] === "n") {
        out.push({ t: "next" });
        i += 1;
        continue;
      }
      if (s[i] !== "g") throw new Error(`bad token ${s[i]} at ${i}`);
      const end = s.indexOf(";", i);
      if (end < 0) throw new Error("unterminated guess");
      const raw = s.slice(i + 1, end);
      if (raw.length > MAX_DIGITS || !NUMBER.test(raw)) throw new Error(`bad guess ${raw}`);
      const v = Number(raw);
      if (!Number.isFinite(v)) throw new Error(`bad guess ${raw}`);
      out.push({ t: "guess", v });
      i = end + 1;
    }
    return out;
  },
};
