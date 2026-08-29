import type { Codec } from "@/games/types";
import type { SortAction } from "./module";

/**
 * The resume log (blueprint 8.3): `o{6 digits}` is the order as it stands, `s` is the submit.
 * A move rewrites the order rather than appending an event, so a whole game is 8 characters
 * however long the player pushes rows around. The digit count is the row count; the module's
 * SORT_COUNT is not imported here to keep module.ts and codec.ts free of a cycle.
 */
const ROWS = 6;
const ORDER_RE = new RegExp(`^[0-${ROWS - 1}]{${ROWS}}$`);

export const codec: Codec<SortAction> = {
  enc(log) {
    let out = "";
    let order: readonly number[] | null = null;
    for (const a of log) {
      if (a.t === "order") order = a.perm;
      else if (a.t === "submit") {
        if (order) out += `o${order.join("")}`;
        out += "s";
        order = null;
      }
    }
    if (order) out += `o${order.join("")}`;
    return out;
  },
  dec(s) {
    const out: SortAction[] = [];
    let i = 0;
    while (i < s.length) {
      if (s[i] === "s") {
        out.push({ t: "submit" });
        i += 1;
      } else if (s[i] === "o") {
        const digits = s.slice(i + 1, i + 1 + ROWS);
        if (!ORDER_RE.test(digits)) throw new Error(`population-sort: bad order token at ${i}`);
        out.push({ t: "order", perm: digits.split("").map(Number) });
        i += 1 + ROWS;
      } else throw new Error(`population-sort: bad token ${s[i]} at ${i}`);
    }
    return out;
  },
};
