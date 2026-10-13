import { countryAt, figureAt, scoreState } from "./engine";
import { bestLine, bonusesOf, bonusTotalOf, fameOf, figureFit, whyLine, whySource } from "./scoring";
import { draftPortraitCredit } from "@/lib/data/loader";
import { draftCountrySlug, draftHomelandTotals } from "@/lib/data/draft";
import type { DraftBonuses, DraftFigure, DraftPhase, DraftPick, DraftState, SeatIdx } from "./types";
import { seatIndex } from "./types";

export interface DraftPersonView {
  name: string;
  slug: string;
  portrait: boolean;
  identity: string;
  born: number | null;
  died: number | null;
  activeFrom: number | null;
  activeUntil: number | null;
  era: DraftFigure["era"];
  photoAuthor: string;
  photoLicence: string;
  photoSource: string;
}
export interface DraftCountryView { iso3: string; iso2: string; slug: string; name: string; region: string; }
export interface DraftAppointmentView {
  round: number;
  seat: SeatIdx;
  person: DraftPersonView;
  country: DraftCountryView;
  fit: number;
  fame: number;
  points: number;
  why: string;
  source: string;
}
export interface DraftPassedPerson {
  name: string;
  slug: string;
  portrait: boolean;
  best: { seat: SeatIdx; fit: number; fame: number; points: number; why: string; source: string } | null;
}
export interface DraftReviewRound {
  round: number;
  country: DraftCountryView;
  seatedName: string;
  passedPeople: readonly DraftPassedPerson[];
  unopenedCountries: readonly DraftCountryView[];
}
export interface DraftReview {
  unlocked: boolean;
  rounds: readonly DraftReviewRound[];
  optimal: { score: number; gap: number; seats: readonly DraftAppointmentView[]; bonuses: DraftBonuses; bonusTotal: number } | null;
}
export interface DraftView {
  round: number;
  phase: DraftPhase;
  country: DraftCountryView | null;
  countries: readonly DraftCountryView[];
  people: readonly DraftPersonView[];
  seats: readonly (DraftAppointmentView | null)[];
  score: number;
  fitTotal: number;
  fameTotal: number;
  bonusTotal: number;
  bonuses: DraftBonuses;
  regions: readonly string[];
  early: boolean;
  recent: boolean;
  lastSeat: SeatIdx | null;
  geography: { population: number; area: number; areaPercent: number };
  review: DraftReview | null;
}

function publicPerson(person: DraftFigure): DraftPersonView {
  const credit = draftPortraitCredit(person.slug);
  return { name: person.name, slug: person.slug, portrait: person.portrait, identity: person.identity, born: person.born, died: person.died, activeFrom: person.activeFrom, activeUntil: person.activeUntil, era: person.era, photoAuthor: credit?.author ?? "Wikimedia Commons", photoLicence: credit?.licence ?? "", photoSource: credit?.url ?? "https://commons.wikimedia.org" };
}

function appointmentView(state: DraftState, pick: DraftPick): DraftAppointmentView {
  const selectedCountry = countryAt(state.board, pick);
  const person = figureAt(state.board, pick);
  return { round: pick.round, seat: pick.seat, person: publicPerson(person), country: { iso3: selectedCountry.iso3, iso2: selectedCountry.iso2, slug: draftCountrySlug(selectedCountry.iso3), name: selectedCountry.name, region: selectedCountry.region }, fit: pick.fit, fame: pick.standingPoints, points: pick.points, why: whyLine(person, pick.seat, pick.fit), source: whySource(person, pick.seat) };
}

function reviewOf(state: DraftState, unlocked: boolean): DraftReview | null {
  if (state.phase !== "done") return null;
  const rounds = state.seats.flatMap((pick) => {
    if (!pick) return [];
    const round = state.board.rounds[pick.round];
    const country = round.countries[pick.countryIdx];
    const countryView = (item: typeof country): DraftCountryView => ({ iso3: item.iso3, iso2: item.iso2, slug: draftCountrySlug(item.iso3), name: item.name, region: item.region });
    return [{ round: pick.round, country: countryView(country), seatedName: country.pool[pick.poolIdx].name,
      unopenedCountries: round.countries.filter((_, index) => index !== pick.countryIdx).map(countryView),
      passedPeople: country.pool.filter((_, index) => index !== pick.poolIdx).map((person): DraftPassedPerson => {
        let best: DraftPassedPerson["best"] = null;
        if (unlocked) for (let index = 0; index < 5; index += 1) {
          const seat = seatIndex(index);
          if (seat === null) continue;
          const fit = figureFit(person, seat), fame = fameOf(person);
          if (!best || fit + fame > best.points) best = { seat, fit, fame, points: fit + fame, why: whyLine(person, seat, fit), source: whySource(person, seat) };
        }
        return { name: person.name, slug: person.slug, portrait: person.portrait, best };
      }) }];
  }).sort((left, right) => left.round - right.round);
  const best = unlocked ? bestLine(state.board.rounds) : null;
  const bonuses = best ? bonusesOf(best.picks) : null;
  return { unlocked, rounds, optimal: best && bonuses ? { score: best.score, gap: best.score - scoreState(state).score,
    seats: best.picks.map((pick) => appointmentView(state, pick)), bonuses, bonusTotal: bonusTotalOf(bonuses) } : null };
}

/** Context is supplied by the server, never an action argument or browser-controlled flag. */
export function draftReviewView(state: DraftState, context: { mode: "daily" | "practice"; dateKey: string; today: string }): DraftView {
  return draftView(state, context.mode === "practice" || context.dateKey < context.today);
}

/** Whitelist instead of deleting fields: unopened people and uncommitted values never cross RSC. */
export function draftView(state: DraftState, reviewUnlocked = false): DraftView {
  const round = state.board.rounds[state.round];
  const country = state.country === null ? null : round?.countries[state.country];
  const scored = scoreState(state);
  const seats = state.seats.map((pick) => pick ? appointmentView(state, pick) : null);
  return {
    round: state.round, phase: state.phase,
    country: country ? { iso3: country.iso3, iso2: country.iso2, slug: draftCountrySlug(country.iso3), name: country.name, region: country.region } : null,
    countries: state.phase === "country" ? round.countries.map((c) => ({ iso3: c.iso3, iso2: c.iso2, slug: draftCountrySlug(c.iso3), name: c.name, region: c.region })) : [],
    people: country && state.phase !== "done" ? country.pool.map(publicPerson) : [],
    seats, score: scored.score, fitTotal: scored.fitTotal, fameTotal: scored.standingTotal, bonusTotal: scored.bonusTotal, bonuses: scored.bonuses,
    regions: [...new Set(seats.flatMap((seat) => seat ? [seat.country.region] : []))],
    early: seats.some((seat) => seat?.person.era === "early"), recent: seats.some((seat) => seat?.person.era === "recent"), lastSeat: state.lastSeat,
    geography: draftHomelandTotals(seats.flatMap((seat) => seat ? [seat.country.iso3] : [])),
    review: reviewOf(state, reviewUnlocked),
  };
}
