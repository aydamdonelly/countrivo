import type { Codec } from "@/games/types";
import type { SprintMove } from "@/lib/game-logic/flag-quiz/sprint";

/**
 * The sprint's move log. Every move carries its server receipt time, so the log is the
 * timeline: tokens joined by dots, a letter then a signed base-36 number. `S` start,
 * `A` to `D` an answer (option 1 to 4), `F` finish. An upper-case letter carries an absolute
 * epoch ms; a lower-case one the ms since the previous token. The first token is always
 * absolute, so one encoded move stands on its own (the session encodes each move alone
 * before it appends it). Forty answers fit in about 220 characters.
 *
 * The ten-flag quiz saved JSON logs; those fail here and replay to a fresh sprint.
 */
const ANSWER = "abcd";
const MAX_TOKENS = 80;
const TOKEN = /^([sSfFa-dA-D])(-?[0-9a-z]{1,10})$/;

function letter(move: SprintMove): string {
  return move.t === "start" ? "s" : move.t === "finish" ? "f" : ANSWER[move.i] ?? "";
}

export const codec: Codec<SprintMove> = {
  enc(log) {
    let previous: number | null = null;
    const out: string[] = [];
    for (const move of log) {
      const l = letter(move);
      if (!l || !Number.isSafeInteger(move.at)) throw new Error("flag-quiz: move cannot be encoded");
      out.push(previous === null ? `${l.toUpperCase()}${move.at.toString(36)}` : `${l}${(move.at - previous).toString(36)}`);
      previous = move.at;
    }
    return out.join(".");
  },
  dec(s) {
    if (!s) return [];
    const tokens = s.split(".");
    if (tokens.length > MAX_TOKENS) throw new Error("flag-quiz: log too long");
    let previous: number | null = null;
    return tokens.map((token, index) => {
      const m = TOKEN.exec(token);
      if (!m) throw new Error(`flag-quiz: bad token "${token}"`);
      const absolute = m[1] === m[1].toUpperCase();
      if (index === 0 && !absolute) throw new Error("flag-quiz: log must start with an absolute time");
      const n = parseInt(m[2], 36);
      const at = absolute ? n : (previous ?? 0) + n;
      if (!Number.isSafeInteger(at) || at < 0) throw new Error("flag-quiz: bad time");
      previous = at;
      const l = m[1].toLowerCase();
      const move: SprintMove = l === "s" ? { t: "start", at } : l === "f" ? { t: "finish", at } : { t: "answer", i: ANSWER.indexOf(l), at };
      return move;
    });
  },
};
