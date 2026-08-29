import type { Codec } from "@/games/types";
import type { GuesserAction } from "./module";

/** `g{number};` per guess, `n` per next (blueprint 8.3), about 80 chars. */
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
        i++;
      } else if (s[i] === "g") {
        const end = s.indexOf(";", i);
        if (end < 0) throw new Error("unterminated guess");
        const v = Number(s.slice(i + 1, end));
        if (!Number.isFinite(v)) throw new Error("bad guess");
        out.push({ t: "guess", v });
        i = end + 1;
      } else throw new Error(`bad token ${s[i]} at ${i}`);
    }
    return out;
  },
};
