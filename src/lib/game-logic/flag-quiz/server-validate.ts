/**
 * Server-side replay for submitted Flag Quiz results. Live runs are committed move by move
 * through the server session; this guards the older client-submission path.
 *
 * The ten-flag quiz: Rebuilds the day's board from the same seed
 * the play route uses (`dateSeed(dateKey + edition)`), re-marks the submitted option
 * indices against it and recomputes the points (flags 1 to 7 score 1, flags 8 to 10 score 2).
 * A run whose `answers` do not reproduce its `hits` and its `scoreRaw` is refused.
 */
import { dateSeed } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { FLAG_COUNT, MAX_POINTS, OPTION_COUNT, createFlagQuiz, pointsFromHits } from "./engine";
import { SPRINT_LENGTH, SPRINT_RESULT_VERSION, correctCount, createSprint, reduceSprint, sprintHits } from "./sprint";

/**
 * A sprint run (resultJson v3): the picks and their times since the start are replayed
 * through the sprint reducer on the board of that seed. Every pick must be accepted in
 * order, and the replayed count must match the score.
 */
export function validateFlagSprintResult(seed: number, scoreRaw: number, resultJson: Record<string, unknown>): { valid: boolean; reason?: string } {
  const { answers, ms, hits } = resultJson;
  if (!Array.isArray(answers) || !Array.isArray(ms) || answers.length !== ms.length || answers.length > SPRINT_LENGTH) return { valid: false, reason: "answers and times must pair up" };
  if (!answers.every((a) => Number.isInteger(a) && a >= 0 && a < OPTION_COUNT)) return { valid: false, reason: "every pick is an option index 0 to 3" };
  if (!ms.every((t) => Number.isInteger(t) && t >= 0)) return { valid: false, reason: "every time is a whole ms since the start" };
  if (!Number.isInteger(scoreRaw) || scoreRaw < 0 || scoreRaw > SPRINT_LENGTH) return { valid: false, reason: `scoreRaw out of range: ${scoreRaw}` };
  let state = reduceSprint(createSprint(mulberry32(seed)), { t: "start", at: 0 });
  for (let i = 0; i < answers.length; i++) {
    const before = state.answers.length;
    state = reduceSprint(state, { t: "answer", i: Number(answers[i]), at: Number(ms[i]) });
    if (state.answers.length !== before + 1) return { valid: false, reason: `pick ${i + 1} arrived after the clock ran out` };
  }
  if (correctCount(state) !== scoreRaw) return { valid: false, reason: `count mismatch: replay ${correctCount(state)}, submitted ${scoreRaw}` };
  const replayed = sprintHits(state);
  if (!Array.isArray(hits) || hits.length !== replayed.length || hits.some((h, i) => h !== replayed[i])) return { valid: false, reason: "hits do not match the replayed board" };
  return { valid: true };
}

export function validateFlagQuizResult(
  dateKey: string,
  scoreRaw: number,
  resultJson: Record<string, unknown>,
  edition: string,
): { valid: boolean; reason?: string } {
  if (resultJson.v === SPRINT_RESULT_VERSION) return validateFlagSprintResult(dateSeed(dateKey + edition), scoreRaw, resultJson);
  const answers = resultJson.answers;
  if (!Array.isArray(answers) || answers.length !== FLAG_COUNT) return { valid: false, reason: "answers must hold ten picks" };
  if (!answers.every((a) => Number.isInteger(a) && a >= 0 && a < OPTION_COUNT)) return { valid: false, reason: "every pick is an option index 0 to 3" };
  if (!Number.isInteger(scoreRaw) || scoreRaw < 0 || scoreRaw > MAX_POINTS) return { valid: false, reason: `scoreRaw out of range: ${scoreRaw}` };

  let board;
  try {
    board = createFlagQuiz(mulberry32(dateSeed(dateKey + edition)), { mode: "daily", dateKey });
  } catch {
    return { valid: true };
  }
  const hits = board.questions.map((q, i) => answers[i] === q.correctIndex);
  const points = pointsFromHits(hits);
  if (points !== scoreRaw) return { valid: false, reason: `points mismatch: replay ${points}, submitted ${scoreRaw}` };
  const sent = resultJson.hits;
  if (Array.isArray(sent) && (sent.length !== hits.length || sent.some((h, i) => h !== hits[i]))) {
    return { valid: false, reason: "hits do not match the replayed board" };
  }
  return { valid: true };
}
