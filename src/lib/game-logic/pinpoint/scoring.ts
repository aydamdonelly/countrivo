/**
 * Pinpoint's round score, in a module without data so the board can explain a reveal with
 * the same arithmetic the server scored it with. Inside 25 km is a full 200. Otherwise the
 * distance alone is worth up to 170, falling to 0 at 3,000 km, and every country nearer the
 * pin than the target lowers that ceiling by 30.
 */
export const PINPOINT_FULL_KM = 25;
export const PINPOINT_ZERO_KM = 3000;
export const PINPOINT_AWAY_COST = 30;

export function distancePoints(distanceKm: number): number {
  return distanceKm <= PINPOINT_FULL_KM ? 200 : Math.max(0, Math.round(170 * (1 - distanceKm / PINPOINT_ZERO_KM)));
}

/** The ceiling the countries nearer the pin leave: 170 less 30 for each. */
export function awayCeiling(away: number): number {
  return Math.max(0, 170 - PINPOINT_AWAY_COST * away);
}

export function pinpointPoints(distanceKm: number, away: number): number {
  return distanceKm <= PINPOINT_FULL_KM ? 200 : Math.min(awayCeiling(away), distancePoints(distanceKm));
}

/** `8 countries are nearer your pin than Mongolia. Each costs 30, so 2 481 km scores 0 instead of 29.` */
export function pinpointBreakdown(distanceKm: number, away: number, name = "the target"): string | null {
  if (distanceKm <= PINPOINT_FULL_KM) return null;
  const byDistance = distancePoints(distanceKm), ceiling = awayCeiling(away);
  const km = `${String(Math.round(distanceKm)).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} km`;
  if (away === 0 || ceiling >= byDistance) return `${km} scores ${byDistance} of 170${byDistance === 0 ? ": 3 000 km or more scores nothing" : ""}.`;
  return `${away} ${away === 1 ? "country is" : "countries are"} nearer your pin than ${name}. Each costs 30, so ${km} scores ${ceiling} instead of ${byDistance}.`;
}
