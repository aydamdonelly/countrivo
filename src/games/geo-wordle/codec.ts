import type { Codec } from "@/games/types";
import type { GeoAction } from "./module";

const TOKEN = /^[A-Z]{3}$/;

/**
 * `g{ISO}` per guess (blueprint 8.3): four bytes each, 24 for a full board, far under the
 * 900-byte cookie cap. A refusal never reaches the log (the host persists no `ui` action, and
 * the filter here keeps the codec honest on its own). A malformed log throws, and the page
 * then discards the cookie and deals a fresh board.
 */
export const codec: Codec<GeoAction> = {
  enc(log) {
    return log.map((a) => (a.t === "guess" ? `g${a.iso3}` : "")).join("");
  },
  dec(s) {
    if (s.length % 4 !== 0) throw new Error(`geo-wordle: log length ${s.length}`);
    const out: GeoAction[] = [];
    for (let i = 0; i < s.length; i += 4) {
      const iso3 = s.slice(i + 1, i + 4);
      if (s[i] !== "g" || !TOKEN.test(iso3)) throw new Error(`geo-wordle: bad token at ${i}`);
      out.push({ t: "guess", iso3 });
    }
    return out;
  },
};
