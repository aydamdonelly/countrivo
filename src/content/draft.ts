/** Public rules describe decisions. Individual values stay hidden until a person is seated. */
import { BANDS as ENGINE_BANDS, BONUSES as ENGINE_BONUSES, MAX_BASE, MAX_BONUS, MAX_SCORE, ROUNDS, SEAT_NAMES, SEAT_WANTS } from "@/lib/game-logic/country-draft/tables";

export interface Seat { name: string; wants: string; }
export const SEATS: readonly Seat[] = SEAT_NAMES.map((name, index) => ({ name, wants: SEAT_WANTS[index] }));
export const SEAT_CHIPS: readonly string[] = SEAT_NAMES;
export const BONUSES = ENGINE_BONUSES.map((bonus) => ({ name: bonus.name, needs: bonus.needs, points: bonus.points }));
export const BANDS = ENGINE_BANDS.map((band) => ({ from: band.from, word: band.word }));
export { MAX_BASE, MAX_BONUS, MAX_SCORE, ROUNDS };
export const DRAFT_FIELDS: readonly string[] = ["leaders", "commanders", "founders", "scientists", "writers", "musicians", "film and stage", "athletes"];
