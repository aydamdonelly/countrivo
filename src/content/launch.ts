/**
 * The Product Hunt launch (scheduled 25 November 2026). The home shows one quiet line for the
 * 24 hours the launch is live on Product Hunt: 00:01 PST on 5 December to 00:01 PST on 6 December.
 */
export const PRODUCT_HUNT_URL = "https://www.producthunt.com/products/countrivo?launch=countrivo";
const LAUNCH_START = Date.parse("2026-12-05T08:01:00Z");
const LAUNCH_END = Date.parse("2026-12-06T08:01:00Z");

export function productHuntLive(now: number): boolean {
  return now >= LAUNCH_START && now < LAUNCH_END;
}
