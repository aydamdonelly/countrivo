import type { Codec } from "@/games/types";
import type { QuizAction } from "./module";

/**
 * The resume log: the version tag `q2` then one digit per answer, twelve characters at
 * most. `advance` is a ui action, so it never reaches the log; the replay re-applies it after
 * every answer. A log from the old ten-flag rules (bare digits, no tag) fails `dec`, and the
 * play page then discards the cookie instead of replaying it into the new board.
 *
 * The constants are spelled out here rather than imported from module.ts: the play page
 * loads the codec on its own (the server decodes the cookie without the board), so this file
 * must not pull the module in.
 */
const VERSION = "q2";
const OPTIONS = 4;
const FLAGS = 10;

export const codec: Codec<QuizAction> = {
  enc(log) {
    let out = VERSION;
    for (const a of log) if (a.t === "answer") out += String(a.i);
    return out;
  },
  dec(s) {
    if (!s.startsWith(VERSION)) throw new Error("flag-quiz: resume log from another version");
    const body = s.slice(VERSION.length);
    if (body.length > FLAGS) throw new Error("flag-quiz: resume log too long");
    return [...body].map((ch) => {
      const i = Number(ch);
      if (!/^\d$/.test(ch) || i >= OPTIONS) throw new Error(`flag-quiz: bad answer "${ch}"`);
      const action: QuizAction = { t: "answer", i };
      return action;
    });
  },
};
