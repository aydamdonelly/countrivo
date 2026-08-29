import type { Codec } from "@/games/types";
import type { GeoAction } from "./module";

/** `g{ISO}` per guess (blueprint 8.3), 24 chars worst case. */
export const codec: Codec<GeoAction> = {
  enc(log) {
    return log.map((a) => `g${a.iso3}`).join("");
  },
  dec(s) {
    const out: GeoAction[] = [];
    for (let i = 0; i < s.length; i += 4) {
      const iso3 = s.slice(i + 1, i + 4);
      if (s[i] !== "g" || !/^[A-Z]{3}$/.test(iso3)) throw new Error(`bad guess at ${i}`);
      out.push({ t: "guess", iso3 });
    }
    return out;
  },
};
