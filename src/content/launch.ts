/**
 * The Product Hunt launch (scheduled 25 November 2026, moved to 28 November). The home shows one quiet line for the
 * 24 hours the launch is live on Product Hunt: 00:01 PST on 28 November to 00:01 PST on 29 November.
 */
export const PRODUCT_HUNT_URL = "https://www.producthunt.com/products/countrivo?launch=countrivo";
const LAUNCH_START = Date.parse("2026-11-28T08:01:00Z");
const LAUNCH_END = Date.parse("2026-11-29T08:01:00Z");

export function productHuntLive(now: number): boolean {
  return now >= LAUNCH_START && now < LAUNCH_END;
}
