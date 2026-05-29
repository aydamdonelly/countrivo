import { countries, categories } from "@/lib/data/loader";
import statsData from "@/data/stats.json";
import { seededShuffle } from "@/lib/seeded-random";
import type { BudgetConfig, BudgetCountry } from "./types";

const stats: Record<string, Record<string, number | null>> = statsData;

const PICK = 5;
const TOKENS = 100;

// Only metrics where summing across countries is meaningful (absolute totals,
// not per-capita / percentages / rates).
const ADDITIVE_METRICS = ["population", "gdp", "area-km2", "tourism-arrivals", "fdi-inflow"];

// Largest-remainder rounding so integer shares sum to exactly 100.
function roundShares(raw: number[]): number[] {
  const floors = raw.map((v) => Math.floor(v));
  let remainder = 100 - floors.reduce((a, b) => a + b, 0);
  const byFrac = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  const out = [...floors];
  for (let k = 0; remainder > 0 && k < byFrac.length; k++, remainder--) {
    out[byFrac[k].i] += 1;
  }
  return out;
}

export function generateBudgetConfig(
  rng: () => number,
  mode: "daily" | "practice",
  dateKey: string,
): BudgetConfig {
  const eligibleMetrics = categories.filter((c) => ADDITIVE_METRICS.includes(c.slug));

  let chosenMetric = eligibleMetrics[0];
  let picked: { iso3: string }[] = [];
  let values: number[] = [];
  let total = 0;
  let shares: number[] = [];

  for (let attempt = 0; attempt < 60; attempt++) {
    const metric = seededShuffle(eligibleMetrics, rng)[0];
    const eligible = countries.filter((c) => {
      const v = stats[c.iso3]?.[metric.slug];
      return typeof v === "number" && v > 0;
    });
    if (eligible.length < PICK) continue;

    const cand = seededShuffle(eligible, rng).slice(0, PICK);
    const vals = cand.map((c) => stats[c.iso3]![metric.slug] as number);
    const tot = vals.reduce((a, b) => a + b, 0);
    const rawShares = vals.map((v) => (v / tot) * 100);
    const rounded = roundShares(rawShares);
    const baseErr = rounded.reduce((s, sh) => s + Math.abs(20 - sh), 0);

    // Reject trivial puzzles: one country dominating, or shares too close to even
    // (even split would already be ~correct, and baseError ~0 breaks scoring).
    if (Math.max(...rounded) > 55) continue;
    if (baseErr < 28) continue;

    chosenMetric = metric;
    picked = cand;
    values = vals;
    total = tot;
    shares = rounded;
    break;
  }

  // Fallback (extremely unlikely): first eligible population set.
  if (picked.length === 0) {
    const eligible = countries.filter((c) => {
      const v = stats[c.iso3]?.population;
      return typeof v === "number" && v > 0;
    });
    chosenMetric = eligibleMetrics.find((m) => m.slug === "population") ?? eligibleMetrics[0];
    picked = seededShuffle(eligible, rng).slice(0, PICK);
    values = picked.map((c) => stats[c.iso3]!.population as number);
    total = values.reduce((a, b) => a + b, 0);
    shares = roundShares(values.map((v) => (v / total) * 100));
  }

  const outCountries: BudgetCountry[] = picked.map((c, i) => ({
    iso3: c.iso3,
    value: values[i],
    trueShare: shares[i],
  }));
  const baseError = shares.reduce((s, sh) => s + Math.abs(20 - sh), 0);

  return {
    metricSlug: chosenMetric.slug,
    metricLabel: chosenMetric.label,
    metricClarifier: chosenMetric.clarifier,
    unit: chosenMetric.unit,
    total,
    countries: outCountries,
    baseError,
    tokens: TOKENS,
    mode,
    dateKey,
  };
}
