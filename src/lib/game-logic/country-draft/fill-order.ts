/*
 * The order the map fills in. The score is a count out of 195, so the artifact is the 195
 * sovereign states and the score is how many of them are taken. The order is a real
 * geodesic sort: every state ranked by its great-circle distance to the NEAREST of the
 * five countries that gave you your cabinet, ties broken by iso3. So the conquest visibly
 * radiates out of those five, the five themselves are always the first five filled, and
 * two players with the same score on the same day get the same picture.
 *
 * No RNG, so the run page redraws the map from resultJson.roundCountries alone.
 */
import centroids from "@/data/centroids.json";
import sovereign from "@/data/sovereign.json";

const CENTROIDS: Record<string, number[]> = centroids;

/** The 195 UN member states plus the Holy See and Palestine. */
export const SOVEREIGN: readonly string[] = sovereign as string[];

const RAD = Math.PI / 180;

/** Great-circle distance in kilometres between two [lat, lng] pairs. */
function haversine(a: number[], b: number[]): number {
  const dLat = (b[0] - a[0]) * RAD;
  const dLng = (b[1] - a[1]) * RAD;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function fillOrder(roundIso3: readonly string[]): string[] {
  const homes = roundIso3.map((iso3) => CENTROIDS[iso3]).filter((c): c is number[] => Array.isArray(c) && c.length === 2);
  const ranked = SOVEREIGN.map((iso3) => {
    const here = CENTROIDS[iso3];
    if (!here || here.length !== 2 || homes.length === 0) return { iso3, d: Number.MAX_SAFE_INTEGER };
    let d = Number.MAX_SAFE_INTEGER;
    for (const home of homes) d = Math.min(d, haversine(here, home));
    return { iso3, d };
  });
  ranked.sort((x, y) => (x.d === y.d ? (x.iso3 < y.iso3 ? -1 : 1) : x.d - y.d));
  return ranked.map((r) => r.iso3);
}

/** The countries a score of `score` takes, in fill order. */
export function takenAt(roundIso3: readonly string[], score: number): string[] {
  return fillOrder(roundIso3).slice(0, Math.max(0, Math.min(SOVEREIGN.length, score)));
}
