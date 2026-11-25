import type { Codec } from "@/games/types";
import type { CapitalAction } from "./module";

/**
 * The resume log: the version tag `c1`, then one token per action. `r` plus a letter is the
 * continent filter (w world, f Africa, m Americas, s Asia, e Europe, o Oceania), a digit is a
 * pick, `n` closes the reveal. The filter only acts before the first pick and re-deals the
 * whole board, so `enc` keeps the last filter only and writes it first: replaying the folded
 * log lands on the same board. A finished run is 24 characters; anything over 40 is refused.
 *
 * The letters are spelled out here rather than imported from the engine: the play page loads
 * the codec on its own, so this file must not pull the country data in.
 */
const VERSION = "c1";
const OPTIONS = 4;
const MAX_LENGTH = 40;
const REGION_CODES = { world: "w", africa: "f", americas: "m", asia: "s", europe: "e", oceania: "o" } as const;
type RegionCode = keyof typeof REGION_CODES;
const REGION_BY_CODE = new Map(Object.entries(REGION_CODES).map(([region, code]) => [code as string, region as RegionCode]));

export const codec: Codec<CapitalAction> = {
  enc(log) {
    let region = "";
    let body = "";
    for (const a of log) {
      if (a.t === "region") region = `r${REGION_CODES[a.r]}`;
      else if (a.t === "pick") body += String(a.i);
      else if (a.t === "next") body += "n";
    }
    return VERSION + region + body;
  },
  dec(s) {
    if (!s.startsWith(VERSION)) throw new Error("capital-quiz: resume log from another version");
    if (s.length > MAX_LENGTH) throw new Error("capital-quiz: resume log too long");
    const out: CapitalAction[] = [];
    const body = s.slice(VERSION.length);
    for (let k = 0; k < body.length; k += 1) {
      const ch = body[k];
      if (ch === "r") {
        const region = REGION_BY_CODE.get(body[k + 1] ?? "");
        if (!region) throw new Error("capital-quiz: bad region");
        out.push({ t: "region", r: region });
        k += 1;
      } else if (ch === "n") {
        out.push({ t: "next" });
      } else if (/^\d$/.test(ch) && Number(ch) < OPTIONS) {
        out.push({ t: "pick", i: Number(ch) });
      } else {
        throw new Error(`capital-quiz: bad token "${ch}"`);
      }
    }
    return out;
  },
};
