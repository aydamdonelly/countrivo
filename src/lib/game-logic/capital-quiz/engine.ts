/*
 * Capital Quiz (practice only): a country is named, pick its capital from four cities.
 *
 * - Ten rounds, one point each. After every pick the board shows the right answer, and the
 *   player moves on with an explicit `next`, so there is time to read it.
 * - The pool is every sovereign state with at least one accepted capital in
 *   capitals-accepted.json. Countries whose capital is disputed (an empty list there) are
 *   never dealt and their cities never appear as distractors. Countries whose name gives
 *   the capital away (Monaco, Mexico City, Tunis) are not asked about either.
 * - Where the capital role is split (South Africa, Bolivia) exactly one of the accepted
 *   capitals is offered, and none of the others, so a board always has exactly one right
 *   option. The prompt and the explanation come from the cited overrides in
 *   src/content/capitals.ts.
 * - Distractors are the capitals of other countries in the same subregion first, then the
 *   same region, then anywhere, so the four cities are plausible neighbours.
 * - The optional continent filter re-deals the board from the same seed, mixed with the
 *   region, before the first pick only.
 *
 * Pure: every random draw comes from the injected `rng`.
 */
import { CAPITAL_OVERRIDES } from "@/content/capitals";
import { capitalsAccepted, countries, sovereignIso3 } from "@/lib/data/public";
import { seededShuffle } from "@/lib/seeded-random";

export const ROUNDS = 10;
export const OPTION_COUNT = 4;

export const CAPITAL_REGIONS = ["world", "africa", "americas", "asia", "europe", "oceania"] as const;
export type CapitalRegion = (typeof CAPITAL_REGIONS)[number];

/** The button label of each filter. */
export const REGION_LABELS: Readonly<Record<CapitalRegion, string>> = {
  world: "World",
  africa: "Africa",
  americas: "Americas",
  asia: "Asia",
  europe: "Europe",
  oceania: "Oceania",
};

/** The `region` value in countries.json each filter keeps; null keeps every region. */
const REGION_DATA: Readonly<Record<CapitalRegion, string | null>> = {
  world: null,
  africa: "Africa",
  americas: "Americas",
  asia: "Asia",
  europe: "Europe",
  oceania: "Oceania",
};

export function isCapitalRegion(value: unknown): value is CapitalRegion {
  return typeof value === "string" && (CAPITAL_REGIONS as readonly string[]).includes(value);
}

export interface CapitalEntry {
  iso3: string;
  iso2: string;
  name: string;
  slug: string;
  region: string;
  subregion: string;
  /** Every capital that counts for this country; the first is the one offered as a distractor. */
  capitals: readonly string[];
}

const SOVEREIGN = new Set(sovereignIso3);

/** Every sovereign state with at least one accepted capital, in data order. */
export const CAPITAL_POOL: readonly CapitalEntry[] = countries
  .filter((c) => SOVEREIGN.has(c.iso3) && (capitalsAccepted[c.iso3]?.length ?? 0) > 0)
  .map((c) => ({
    iso3: c.iso3,
    iso2: c.iso2,
    name: c.displayName,
    slug: c.slug,
    region: c.region,
    subregion: c.subregion,
    capitals: capitalsAccepted[c.iso3] ?? [],
  }));

function folded(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * True when the country's name and one of its capitals contain each other (Monaco, Kuwait
 * City, Tunis): the question would answer itself. Such countries are never asked about,
 * though their capitals still stand as distractors elsewhere.
 */
export function namesItsCapital(entry: CapitalEntry): boolean {
  const name = folded(entry.name);
  return entry.capitals.some((city) => {
    const c = folded(city);
    return c.includes(name) || name.includes(c);
  });
}

/** The countries a question may be about. */
export const ASKABLE_POOL: readonly CapitalEntry[] = CAPITAL_POOL.filter((c) => !namesItsCapital(c));

export function poolFor(region: CapitalRegion): CapitalEntry[] {
  const keep = REGION_DATA[region];
  return ASKABLE_POOL.filter((c) => keep === null || c.region === keep);
}

export interface CapitalQuestion {
  iso3: string;
  iso2: string;
  /** The country's display name. */
  country: string;
  /** Its country page: /countries/{slug}. */
  slug: string;
  region: string;
  /** Four distinct capital names. */
  options: string[];
  correctIndex: number;
  /** Every capital that counts for this country; exactly one of them is among the options. */
  accepted: readonly string[];
  /** The extra line for a country whose capital role is split, else null. */
  prompt: string | null;
  /** One sentence shown once the pick is made. */
  explanation: string;
}

export type CapitalPhase = "question" | "reveal" | "results";

export interface CapitalQuizState {
  region: CapitalRegion;
  questions: CapitalQuestion[];
  /** The option picked in each round, null until answered. */
  answers: (number | null)[];
  /** The round on screen. */
  current: number;
  phase: CapitalPhase;
  score: number;
}

/**
 * The seed a region's board is dealt from. The world board keeps the seed itself; each
 * continent mixes in its own odd constant, so one seed gives six unrelated boards.
 */
export function regionSeed(seed: number, region: CapitalRegion): number {
  const index = CAPITAL_REGIONS.indexOf(region);
  if (index <= 0) return seed;
  return (Math.imul(seed ^ (index * 0x9e3779b1), 0x85ebca6b) >>> 1) || index;
}

/** The capitals of `pool` that may stand beside `entry` as wrong answers, nearest first. */
function distractorsFor(entry: CapitalEntry, rng: () => number, need: number): string[] {
  const banned = new Set(entry.capitals);
  const others = CAPITAL_POOL.filter((c) => c.iso3 !== entry.iso3);
  const tiers = [
    others.filter((c) => c.subregion === entry.subregion),
    others.filter((c) => c.subregion !== entry.subregion && c.region === entry.region),
    others.filter((c) => c.region !== entry.region),
  ];
  const out: string[] = [];
  for (const tier of tiers) {
    for (const c of seededShuffle(tier, rng)) {
      if (out.length >= need) return out;
      const city = c.capitals[0];
      if (banned.has(city) || out.includes(city)) continue;
      out.push(city);
    }
  }
  return out;
}

/** One question for one country: the offered capital, three neighbours' capitals, shuffled. */
export function questionFor(entry: CapitalEntry, rng: () => number): CapitalQuestion {
  const offered = entry.capitals.length > 1 ? entry.capitals[Math.floor(rng() * entry.capitals.length)] : entry.capitals[0];
  const options = seededShuffle([offered, ...distractorsFor(entry, rng, OPTION_COUNT - 1)], rng);
  const override = CAPITAL_OVERRIDES[entry.iso3];
  return {
    iso3: entry.iso3,
    iso2: entry.iso2,
    country: entry.name,
    slug: entry.slug,
    region: entry.region,
    options,
    correctIndex: options.indexOf(offered),
    accepted: entry.capitals,
    prompt: override?.question ?? null,
    explanation: override?.explanation ?? `The capital of ${entry.name} is ${offered}.`,
  };
}

export function createCapitalQuiz(rng: () => number, region: CapitalRegion = "world"): CapitalQuizState {
  const pool = poolFor(region);
  const dealt = seededShuffle(pool, rng).slice(0, Math.min(ROUNDS, pool.length));
  return {
    region,
    questions: dealt.map((entry) => questionFor(entry, rng)),
    answers: dealt.map(() => null),
    current: 0,
    phase: "question",
    score: 0,
  };
}

/** The filter may change only before the first pick. */
export function canChooseRegion(state: CapitalQuizState): boolean {
  return state.phase === "question" && state.current === 0 && state.answers.every((a) => a === null);
}

export function currentQuestion(state: CapitalQuizState): CapitalQuestion {
  return state.questions[state.current];
}

/** Commit a pick on the question on screen; the right answer is revealed until `next`. */
export function pick(state: CapitalQuizState, index: number): CapitalQuizState {
  if (state.phase !== "question") return state;
  const q = currentQuestion(state);
  if (!q || !Number.isInteger(index) || index < 0 || index >= q.options.length) return state;
  const answers = state.answers.slice();
  answers[state.current] = index;
  return { ...state, answers, phase: "reveal", score: state.score + (index === q.correctIndex ? 1 : 0) };
}

/** Close the reveal: the next country, or the result after the last one. */
export function next(state: CapitalQuizState): CapitalQuizState {
  if (state.phase !== "reveal") return state;
  if (state.current + 1 >= state.questions.length) return { ...state, phase: "results" };
  return { ...state, current: state.current + 1, phase: "question" };
}

/** Right or wrong per answered round, in board order. */
export function hits(state: CapitalQuizState): boolean[] {
  return state.questions.flatMap((q, i) => {
    const a = state.answers[i];
    return a === null ? [] : [a === q.correctIndex];
  });
}

/** Round indices answered wrongly. */
export function misses(state: CapitalQuizState): number[] {
  return state.questions.flatMap((q, i) => {
    const a = state.answers[i];
    return a !== null && a !== q.correctIndex ? [i] : [];
  });
}
