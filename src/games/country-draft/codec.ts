import type { Codec } from "@/games/types";
import type { CountryDraftAction } from "./module";
import { poolIndex, seatIndex } from "@/lib/game-logic/country-draft/types";

export const codec: Codec<CountryDraftAction> = {
  enc(log) {
    return log.map((a) => a.t === "open" ? `o${a.c}` : a.t === "appoint" ? `a${a.i}${a.s}` : a.t === "next" ? "n" : a.t === "seen" ? "z" : "").join("");
  },
  dec(value) {
    const actions: CountryDraftAction[] = [];
    for (let offset = 0; offset < value.length; offset += 1) {
      const token = value[offset];
      if (token === "o") {
        const c = poolIndex(Number(value[offset + 1]));
        if (c === null || !/^[0-2]$/.test(value[offset + 1] ?? "")) throw new Error("Invalid country choice");
        actions.push({ t: "open", c }); offset += 1;
      } else if (token === "a") {
        const i = poolIndex(Number(value[offset + 1]));
        const s = seatIndex(Number(value[offset + 2]));
        if (i === null || s === null || !/^[0-2][0-4]$/.test(value.slice(offset + 1, offset + 3))) throw new Error("Invalid appointment");
        actions.push({ t: "appoint", i, s }); offset += 2;
      } else if (token === "n") actions.push({ t: "next" });
      else if (token === "z") actions.push({ t: "seen" });
      else throw new Error(`Invalid draft token ${token}`);
    }
    return actions;
  },
};
