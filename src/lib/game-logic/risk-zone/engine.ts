import { countries, categories } from "@/lib/data/loader";
import statsData from "@/data/stats.json";
import { seededShuffle } from "@/lib/seeded-random";
import type { Country } from "@/types/country";
import type { Category } from "@/types/category";

const stats: Record<string, Record<string, number | null>> = statsData;

const CHAIN_COUNT = 5;
const MAX_STEPS = 7; // max reveals per chain (multiplier caps before this)
// Multiplier by number of correct reveals already banked-toward (capped x5).
const MULTIPLIERS = [1, 1.5, 2.25, 3, 4, 5, 5] as const;
// Same intuitive, high-coverage set as higher-or-lower.
const GOOD_CATEGORIES = [
  "population",
  "area-km2",
  "gdp-per-capita",
  "gdp",
  "life-expectancy",
  "urban-population-pct",
  "internet-users-pct",
  "fertility-rate",
  "tourism-arrivals",
  "forest-coverage-pct",
];
const BASE_POINTS = 100;

export const RISK_CHAIN_COUNT = CHAIN_COUNT;
export const RISK_MULTIPLIERS = MULTIPLIERS;
export const RISK_MAX_SCORE = CHAIN_COUNT * Math.round(BASE_POINTS * MULTIPLIERS[5]); // 5 * 500 = 2500

export interface RiskStep {
  challenger: Country;
  challengerValue: number;
  answer: "higher" | "lower";
}
export interface RiskChain {
  category: Category;
  base: Country;
  baseValue: number;
  steps: RiskStep[];
}
export interface ChainResult {
  bankedAt: number;
  points: number;
  outcome: "banked" | "wiped";
  category: string;
}
export interface RiskZoneState {
  chains: RiskChain[];
  chainIndex: number;
  stepIndex: number; // index into current chain's steps for the NEXT reveal
  correctInChain: number;
  anchorValue: number; // running anchor (advances to each revealed value)
  bankedTotal: number; // the score
  pendingPot: number; // what BANK would lock right now
  lastReveal: RiskStep | null;
  lastOutcome: "correct" | "wrong" | null;
  phase: "guess" | "decide" | "wiped" | "banked" | "results";
  log: ChainResult[];
}

function statVal(iso3: string, slug: string): number | null {
  const v = stats[iso3]?.[slug];
  return typeof v === "number" ? v : null;
}
function eligibleFor(slug: string): Country[] {
  return countries.filter((c) => statVal(c.iso3, slug) !== null);
}
export function riskMultiplier(correct: number): number {
  return MULTIPLIERS[Math.min(correct, MULTIPLIERS.length - 1)];
}
function potFor(correct: number): number {
  return Math.round(BASE_POINTS * riskMultiplier(correct));
}
export { potFor as riskPotFor };

function buildChain(rng: () => number): RiskChain | null {
  const usable = categories.filter((c) => GOOD_CATEGORIES.includes(c.slug));
  const cat = usable[Math.floor(rng() * usable.length)];
  const pool = eligibleFor(cat.slug);
  if (pool.length < MAX_STEPS + 1) return null;

  // Distinct sequence; anchor advances each step. Equal values are unwinnable, so skip them.
  const ordered = seededShuffle(pool, rng);
  const base = ordered[0];
  const baseValue = statVal(base.iso3, cat.slug);
  if (baseValue == null) return null;
  let anchor = baseValue;
  const steps: RiskStep[] = [];
  for (let i = 1; i < ordered.length && steps.length < MAX_STEPS; i++) {
    const ch = ordered[i];
    const v = statVal(ch.iso3, cat.slug);
    if (v == null || v === anchor) continue;
    steps.push({ challenger: ch, challengerValue: v, answer: v > anchor ? "higher" : "lower" });
    anchor = v;
  }
  if (steps.length < MAX_STEPS) return null;
  return { category: cat, base, baseValue, steps };
}

export function createRiskZone(rng: () => number): RiskZoneState {
  const chains: RiskChain[] = [];
  let attempts = 0;
  while (chains.length < CHAIN_COUNT && attempts < CHAIN_COUNT * 12) {
    attempts++;
    const c = buildChain(rng);
    if (c) chains.push(c);
  }
  while (chains.length < CHAIN_COUNT) {
    const c = buildChain(rng);
    if (c) chains.push(c);
    else break;
  }
  const first = chains[0];
  return {
    chains,
    chainIndex: 0,
    stepIndex: 0,
    correctInChain: 0,
    anchorValue: first.baseValue,
    bankedTotal: 0,
    pendingPot: BASE_POINTS,
    lastReveal: null,
    lastOutcome: null,
    phase: "guess",
    log: [],
  };
}

export function guess(state: RiskZoneState, choice: "higher" | "lower"): RiskZoneState {
  if (state.phase !== "guess") return state;
  const chain = state.chains[state.chainIndex];
  const step = chain.steps[state.stepIndex];
  const correct = choice === step.answer;
  if (!correct) {
    const log: ChainResult[] = [
      ...state.log,
      { bankedAt: state.correctInChain, points: 0, outcome: "wiped", category: chain.category.shortLabel },
    ];
    return { ...state, phase: "wiped", lastReveal: step, lastOutcome: "wrong", log };
  }
  const newCorrect = state.correctInChain + 1;
  const newAnchor = step.challengerValue;
  const reachedEnd = state.stepIndex + 1 >= chain.steps.length;
  const pot = potFor(newCorrect);
  if (reachedEnd) {
    const log: ChainResult[] = [
      ...state.log,
      { bankedAt: newCorrect, points: pot, outcome: "banked", category: chain.category.shortLabel },
    ];
    return {
      ...state,
      phase: "banked",
      correctInChain: newCorrect,
      anchorValue: newAnchor,
      bankedTotal: state.bankedTotal + pot,
      pendingPot: pot,
      lastReveal: step,
      lastOutcome: "correct",
      log,
    };
  }
  return {
    ...state,
    phase: "decide",
    correctInChain: newCorrect,
    anchorValue: newAnchor,
    stepIndex: state.stepIndex + 1,
    pendingPot: pot,
    lastReveal: step,
    lastOutcome: "correct",
  };
}

export function bank(state: RiskZoneState): RiskZoneState {
  if (state.phase !== "decide") return state;
  const chain = state.chains[state.chainIndex];
  const log: ChainResult[] = [
    ...state.log,
    { bankedAt: state.correctInChain, points: state.pendingPot, outcome: "banked", category: chain.category.shortLabel },
  ];
  return { ...state, phase: "banked", bankedTotal: state.bankedTotal + state.pendingPot, log };
}

export function push(state: RiskZoneState): RiskZoneState {
  if (state.phase !== "decide") return state;
  return { ...state, phase: "guess", lastReveal: null, lastOutcome: null };
}

export function nextChain(state: RiskZoneState): RiskZoneState {
  if (state.phase !== "wiped" && state.phase !== "banked") return state;
  const next = state.chainIndex + 1;
  if (next >= state.chains.length) return { ...state, phase: "results" };
  const chain = state.chains[next];
  return {
    ...state,
    chainIndex: next,
    stepIndex: 0,
    correctInChain: 0,
    anchorValue: chain.baseValue,
    pendingPot: BASE_POINTS,
    lastReveal: null,
    lastOutcome: null,
    phase: "guess",
  };
}
