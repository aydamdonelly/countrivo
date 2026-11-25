/*
 * Flag Quiz: the twenty-second flag sprint (November 2026). The engine in
 * src/lib/game-logic/flag-quiz/sprint.ts is pure; this adapter gives it the shared game
 * contract. It runs only on the server: every move reaches it through the quick session
 * action, which stamps the move with the server's receipt time first, so the client never
 * supplies a time and never sees a flag before it is on screen.
 *
 * Boards frozen under the ten-flag rules keep playing through legacy-module.ts.
 */
import { mulberry32 } from "@/lib/seeded-random";
import {
  PENALTY_SECONDS,
  SPRINT_LENGTH,
  SPRINT_RESULT_VERSION,
  SPRINT_SECONDS,
  SPRINT_TARGET,
  correctCount,
  createSprint,
  flagsLabel,
  reduceSprint,
  sprintDone,
  sprintHits,
  wrongCount,
  type SprintMove,
  type SprintState,
} from "@/lib/game-logic/flag-quiz/sprint";
import { buildFlagSprintShareText } from "@/lib/share/flag-quiz";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export type { SprintMove, SprintState };

/** Practice sessions saved under the ten-flag rules start a fresh sprint instead of replaying. */
export const FLAG_SPRINT_VERSION = 3;

export const gameModule: GameModule<SprintState, SprintMove> = {
  slug: "flag-quiz",
  contentVersion: FLAG_SPRINT_VERSION,

  create(seed) {
    return createSprint(mulberry32(seed));
  },

  reduce: reduceSprint,

  codec,

  done: sprintDone,

  progress(s) {
    return {
      done: s.answers.length,
      label: "right",
      value: String(correctCount(s)),
      extra: `in ${SPRINT_SECONDS} s`,
      misses: sprintHits(s).flatMap((ok, i) => (ok ? [] : [i])),
    };
  },

  verdict: () => null,

  payload(s, ctx) {
    const correct = correctCount(s);
    const start = s.startedAt ?? 0;
    return {
      gameSlug: "flag-quiz",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: correct,
      scoreMax: SPRINT_LENGTH,
      scoreSortValue: correct,
      scoreDisplay: flagsLabel(correct),
      resultJson: {
        v: SPRINT_RESULT_VERSION,
        correct,
        wrong: wrongCount(s),
        answered: s.answers.length,
        seconds: SPRINT_SECONDS,
        penalty: PENALTY_SECONDS,
        target: SPRINT_TARGET,
        end: s.end,
        answers: s.answers.map((a) => a.i),
        ms: s.answers.map((a) => a.at - start),
        hits: sprintHits(s),
      },
      startedAt: ctx.startedAt,
    };
  },

  scoreLabel: (s) => flagsLabel(correctCount(s)),

  share(s, ctx) {
    return buildFlagSprintShareText({ correct: correctCount(s), hits: sprintHits(s), seconds: SPRINT_SECONDS, dateKey: ctx.dateKey, practice: ctx.mode === "practice" });
  },

  keepBoardOnResult: false,
  submits: true,
};
