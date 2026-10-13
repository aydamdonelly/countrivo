/**
 * Server checks for a Blind Pick run (concept 5.7, 6 x 6 golf).
 *
 * `blindPickShapeError` is the structural gate for every run (daily and practice): the six
 * placements form a permutation, the ranks add up, and the golf score agrees with them.
 * `validateBlindPickResult` is the daily replay: it re-deals the board from the same seed the
 * play page uses (`dateSeed(dateKey + edition)`), replays the six placements against it and
 * recomputes the golf score from scratch. Nothing the client sends about ranks is trusted.
 */
import { getDailyRng } from "@/lib/daily-seed";
import { generateBlindPickConfig, BOARD_SIZE } from "./generator";
import { BLIND_PICK_MAX_OVER, closestPerfect } from "./scoring";

function intArray(x: unknown, length: number): number[] | null {
  if (!Array.isArray(x) || x.length !== length) return null;
  const out: number[] = [];
  for (const v of x) {
    if (typeof v !== "number" || !Number.isInteger(v)) return null;
    out.push(v);
  }
  return out;
}

function isPermutation(p: readonly number[], n: number): boolean {
  return p.length === n && new Set(p).size === n && p.every((v) => v >= 0 && v < n);
}

/** The structural check behind validateGameResult. Returns an error code, or null when the payload is consistent. */
export function blindPickShapeError(scoreRaw: number, scoreMax: number, r: Record<string, unknown>): string | null {
  if (typeof r.over !== "number" || typeof r.playerScore !== "number" || typeof r.optimalScore !== "number") return "invalid_result";
  const placements = intArray(r.placements, BOARD_SIZE);
  const ranks = intArray(r.ranks, BOARD_SIZE);
  if (!placements || !ranks || !isPermutation(placements, BOARD_SIZE)) return "invalid_result";
  if (ranks.some((n) => n < 1)) return "invalid_result";
  if (r.over !== scoreRaw) return "score_mismatch";
  if (ranks.reduce((a, b) => a + b, 0) !== r.playerScore) return "score_mismatch";
  if (r.playerScore - r.optimalScore !== scoreRaw) return "score_mismatch";
  if (scoreRaw < 0 || scoreRaw > scoreMax || scoreRaw > BLIND_PICK_MAX_OVER) return "score_exceeds_total";
  return null;
}

/** The daily replay. `{ valid: false }` only when the run cannot have been played on today's board. */
export function validateBlindPickResult(
  dateKey: string,
  scoreRaw: number,
  resultJson: Record<string, unknown>,
  edition: string,
): { valid: boolean; reason?: string } {
  const shape = blindPickShapeError(scoreRaw, BLIND_PICK_MAX_OVER, resultJson);
  if (shape) return { valid: false, reason: shape };

  const config = generateBlindPickConfig(getDailyRng(dateKey, edition), "daily", dateKey);

  const iso3s = resultJson.countryIso3s;
  if (!Array.isArray(iso3s) || iso3s.length !== BOARD_SIZE || iso3s.some((v, i) => v !== config.countries[i].iso3)) {
    return { valid: false, reason: "countries do not match today's board" };
  }
  const stats = resultJson.stats;
  if (!Array.isArray(stats) || stats.length !== BOARD_SIZE || stats.some((v, i) => v !== config.categories[i].slug)) {
    return { valid: false, reason: "stats do not match today's board" };
  }

  const placements = intArray(resultJson.placements, BOARD_SIZE);
  if (!placements) return { valid: false, reason: "placements malformed" };
  const ranks = placements.map((slot, c) => config.costMatrix[c][slot]);
  const sent = intArray(resultJson.ranks, BOARD_SIZE);
  if (!sent || sent.some((r, i) => r !== ranks[i])) return { valid: false, reason: "ranks do not match the board" };

  const playerScore = ranks.reduce((a, b) => a + b, 0);
  const { sum } = closestPerfect(config.costMatrix, placements);
  if (sum !== config.optimalScore) return { valid: false, reason: "optimal mismatch on the server" };
  if (resultJson.optimalScore !== sum) return { valid: false, reason: `optimalScore ${String(resultJson.optimalScore)} != ${sum}` };
  if (playerScore - sum !== scoreRaw) return { valid: false, reason: `over ${playerScore - sum} != scoreRaw ${scoreRaw}` };

  return { valid: true };
}
