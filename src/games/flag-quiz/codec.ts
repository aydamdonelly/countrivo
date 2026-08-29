import type { Codec } from "@/games/types";
import type { QuizAction } from "./module";

/**
 * The resume log (blueprint 8.3): one digit per answer, ten characters at most, far under the
 * 900-byte cookie cap. `advance` is a ui action, so it never reaches the log; the replay
 * re-applies it after every answer. `dec` throws on a log it cannot read and the play page
 * then discards the cookie instead of replaying nonsense.
 *
 * The digit range is the four options a flag question always has. It is spelled out here
 * rather than imported from module.ts: the play page loads the codec on its own (the server
 * decodes the cookie without the board), so this file must not pull the module in.
 */
const OPTIONS = 4;

export const codec: Codec<QuizAction> = {
  enc(log) {
    let out = "";
    for (const a of log) if (a.t === "answer") out += String(a.i);
    return out;
  },
  dec(s) {
    return [...s].map((ch) => {
      const i = Number(ch);
      if (!Number.isInteger(i) || i < 0 || i >= OPTIONS) throw new Error(`flag-quiz: bad answer "${ch}"`);
      return { t: "answer", i } as QuizAction;
    });
  },
};
