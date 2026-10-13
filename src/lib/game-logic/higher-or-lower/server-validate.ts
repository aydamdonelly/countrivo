/**
 * Server-side replay for a Higher or Lower daily (concept 5.9 rule 14, with today's seed
 * convention): rebuild the board from `dateSeed(dateKey + edition)`, confirm the submitted
 * stat and chain are today's, replay the ten calls and recompute the points. Nothing the
 * client says about right or wrong is trusted.
 */
import { dateSeed } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { DAILY_CALLS, DAILY_MAX, createDaily, dailyPoints, hitAt, makeCall, type Call, type HoLGame } from "./engine";

export function validateHigherOrLowerResult(
  dateKey: string,
  scoreRaw: number,
  resultJson: Record<string, unknown>,
  edition: string,
): { valid: boolean; reason?: string } {
  let g: HoLGame;
  try {
    g = createDaily(mulberry32(dateSeed(dateKey + edition)), dateKey);
  } catch {
    // A board the server cannot build is not the player's fault.
    return { valid: true };
  }
  if (resultJson.stat !== g.stat) return { valid: false, reason: `stat mismatch: expected ${g.stat}` };
  const chain = resultJson.chain;
  if (!Array.isArray(chain) || chain.length !== g.chain.length || chain.some((iso3, i) => iso3 !== g.chain[i].iso3)) {
    return { valid: false, reason: "chain mismatch" };
  }
  const calls = resultJson.calls;
  if (typeof calls !== "string" || !/^[hl]*$/.test(calls) || calls.length !== DAILY_CALLS) {
    return { valid: false, reason: "calls must be ten h/l letters" };
  }
  for (const ch of calls) g = makeCall(g, (ch === "h" ? "higher" : "lower") satisfies Call);
  const points = dailyPoints(g);
  if (!Number.isInteger(scoreRaw) || scoreRaw < 0 || scoreRaw > DAILY_MAX) return { valid: false, reason: `scoreRaw out of range: ${scoreRaw}` };
  if (points !== scoreRaw) return { valid: false, reason: `score mismatch: replay ${points}, submitted ${scoreRaw}` };
  if (resultJson.points !== points) return { valid: false, reason: "points mismatch" };
  const hits = resultJson.hits;
  if (!Array.isArray(hits) || hits.length !== DAILY_CALLS || hits.some((h, i) => h !== hitAt(g, i))) {
    return { valid: false, reason: "hits mismatch" };
  }
  return { valid: true };
}
