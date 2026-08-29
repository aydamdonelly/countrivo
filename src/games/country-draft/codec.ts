import type { Codec } from "@/games/types";
import type { CountryDraftAction } from "./module";

/*
 * The resume log (blueprint 8.3): `a{i}{s}` seats person i in seat s, `u` the one
 * take-back, `s` the reveal acknowledged. The appointment carries the person as well as
 * the seat, so a log replays without ever needing the hand: you come back with nothing in
 * it, which is correct. Worst case is five appointments, the take-back, the re-appointment
 * and the reveal token: 20 characters, far inside the 900-byte cookie cap. `dec` throws on
 * anything it cannot read and the play page then drops the cookie.
 */
export const codec: Codec<CountryDraftAction> = {
  enc(log) {
    return log
      .map((a) => {
        switch (a.t) {
          case "appoint":
            return `a${a.i}${a.s}`;
          case "undo":
            return "u";
          case "seen":
            return "s";
          default:
            return "";
        }
      })
      .join("");
  },

  dec(s) {
    const out: CountryDraftAction[] = [];
    for (let i = 0; i < s.length; i += 1) {
      const ch = s[i];
      if (ch === "a") {
        const person = s[i + 1];
        const seat = s[i + 2];
        if (!/^[0-2]$/.test(person ?? "") || !/^[0-4]$/.test(seat ?? "")) throw new Error(`bad appointment at ${i}`);
        out.push({ t: "appoint", i: Number(person) as 0 | 1 | 2, s: Number(seat) as 0 | 1 | 2 | 3 | 4 });
        i += 2;
      } else if (ch === "u") {
        out.push({ t: "undo" });
      } else if (ch === "s") {
        out.push({ t: "seen" });
      } else {
        throw new Error(`bad token ${ch} at ${i}`);
      }
    }
    return out;
  },
};
