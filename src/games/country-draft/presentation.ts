import { safeCareerLine } from "@/lib/game-logic/country-draft/career-ratings";
import type { DraftAppointmentView } from "@/lib/game-logic/country-draft/public-view";
import { MAX_FAME, MAX_FIT, SEAT_NAMES, SEAT_WANTS, fitWord } from "@/lib/game-logic/country-draft/tables";

export const JOB_NAMES = SEAT_NAMES;
export const JOB_HINTS = SEAT_WANTS;

/**
 * First-game guidance. The goal and the scoring rule are general: they never preview a
 * person's fit, and the job buttons themselves stay free of points.
 */
export const DRAFT_GUIDE = {
  goal: "Fill five jobs with famous people",
  example: "A general fits Army, a singer fits Voice.",
  country: "You choose one of its famous people next.",
  people: "Look for a career that fits one of your open jobs.",
  job: "A better career fit earns more points.",
} as const;
export const DRAFT_POINTS_RULE = `Each person scores up to ${MAX_FIT} for job fit and up to ${MAX_FAME} for fame.`;

/** "Strong fit", "No fit": the fit word as a label, never "no fit fit". */
export function fitLabel(fit: number): string {
  const word = fitWord(fit);
  const label = word === "no fit" ? word : `${word} fit`;
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

/** One appointment's two parts, each against its maximum. */
export function pointsLine(fit: number, fame: number): string {
  return `${fitLabel(fit)} ${fit} of ${MAX_FIT} + fame ${fame} of ${MAX_FAME}`;
}

/** Also protects a previously saved public view without rewriting its score. */
export function safeDraftWhy(pick: Pick<DraftAppointmentView, "why" | "seat">): string {
  return safeCareerLine(pick.why, pick.seat);
}

export function cabinetStory(seats: readonly (DraftAppointmentView | null)[]) {
  const picks = seats.filter((pick): pick is DraftAppointmentView => pick !== null);
  const strongest = [...picks].sort((left, right) => right.fit - left.fit || right.points - left.points || left.seat - right.seat)[0] ?? null;
  const weakest = [...picks].filter(pick => pick !== strongest).sort((left, right) => left.fit - right.fit || left.points - right.points || left.seat - right.seat)[0] ?? null;
  const regions = new Set(picks.map(pick => pick.country.region)).size;
  const spansAges = picks.some(pick => pick.person.era === "early") && picks.some(pick => pick.person.era === "recent");
  const title = picks.length === 5 && picks.every(pick => pick.fit >= 25) ? "The dream cabinet"
    : regions >= 3 && spansAges ? "A world of different minds"
    : spansAges ? "The time travellers"
    : regions >= 3 ? "The world-spanning cabinet"
    : picks.some(pick => pick.fit <= 6) ? "The unlikely alliance" : "Your five-person powerhouse";
  return { title, strongest, weakest, weakestLabel: weakest && weakest.fit <= 6 ? "The gamble" : weakest && weakest.fit < 18 ? "Room to improve" : "Strong support" };
}
