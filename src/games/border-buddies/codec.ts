import type { Codec } from "@/games/types";
import type { BorderAction } from "./module";

/** `f{ISO}` per found neighbour, `g` give up (blueprint 8.3): 14 borders = 57 chars. */
export const codec: Codec<BorderAction> = {
  enc(log) {
    return log.map((a) => (a.t === "found" ? `f${a.iso3}` : "g")).join("");
  },
  dec(s) {
    const out: BorderAction[] = [];
    let i = 0;
    while (i < s.length) {
      if (s[i] === "g") {
        out.push({ t: "giveup" });
        i++;
      } else if (s[i] === "f") {
        const iso3 = s.slice(i + 1, i + 4);
        if (!/^[A-Z]{3}$/.test(iso3)) throw new Error(`bad iso3 at ${i}`);
        out.push({ t: "found", iso3 });
        i += 4;
      } else throw new Error(`bad token ${s[i]} at ${i}`);
    }
    return out;
  },
};
