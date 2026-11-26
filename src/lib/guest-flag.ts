/**
 * The flag a guest row shows on a leaderboard (Adam, 27 November 2026): guests who never pick a
 * country get one at random, 70 % United States, 20 % United Kingdom, 10 % Germany. Derived
 * from the run id, so the same row keeps the same flag on every visit. Named players choose their own.
 */
export function guestFlagIso2(runId: number): "US" | "GB" | "DE" {
  let h = (runId ^ 0x5bd1e995) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39) >>> 0;
  const bucket = ((h ^ (h >>> 15)) >>> 0) % 100;
  return bucket < 70 ? "US" : bucket < 90 ? "GB" : "DE";
}

export function isGuestName(name: string | null | undefined): boolean {
  return !name || name.startsWith("guest-");
}
