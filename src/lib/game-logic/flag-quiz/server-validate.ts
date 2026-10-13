/**
 * Server-side replay for the daily Flag Quiz. Rebuilds the day's board from the same seed
 * the play route uses (`dateSeed(dateKey + edition)`), re-marks the submitted option
 * indices against it and recomputes the points (flags 1 to 7 score 1, flags 8 to 10 score 2).
 * A run whose `answers` do not reproduce its `hits` and its `scoreRaw` is refused.
 */
import { dateSeed } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { FLAG_COUNT, MAX_POINTS, OPTION_COUNT, createFlagQuiz, pointsFromHits } from "./engine";

export function validateFlagQuizResult(
  dateKey: string,
  scoreRaw: number,
  resultJson: Record<string, unknown>,
  edition: string,
): { valid: boolean; reason?: string } {
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
