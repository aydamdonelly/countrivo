import { countries, categories } from "@/lib/data/loader";
import ranksData from "@/data/ranks.json";
import { seededShuffle } from "@/lib/seeded-random";
import type { CaravanConfig, CaravanItem } from "./types";

const ranks: Record<string, Record<string, number>> = ranksData;

const SHELF_SIZE = 12;
const BUY_COUNT = 5;
const PRICE_K = 12; // price scale: round(value^1.5 / K * jitter)

// Metrics where a better global rank is unambiguously "more valuable" — so a
// higher value badge always means a better country to carry in the caravan.
const VALUE_METRICS = [
  "gdp",
  "gdp-per-capita",
  "life-expectancy",
  "internet-users-pct",
  "tourism-arrivals",
  "education-spending-pct",
  "health-spending-pct",
];

const valueFromRank = (rank: number): number => 244 - rank; // rank 1 -> 243

/** Brute-force the optimal affordable 5-basket out of 12 (C(12,5) = 792). */
function bestBasket(items: CaravanItem[], budget: number): { value: number; basket: number[] } {
  const n = items.length;
  let best = { value: -1, basket: [] as number[] };
  for (let a = 0; a < n; a++)
    for (let b = a + 1; b < n; b++)
      for (let c = b + 1; c < n; c++)
        for (let d = c + 1; d < n; d++)
          for (let e = d + 1; e < n; e++) {
            const combo = [a, b, c, d, e];
            const price = combo.reduce((s, i) => s + items[i].price, 0);
            if (price > budget) continue;
            const value = combo.reduce((s, i) => s + items[i].value, 0);
            if (value > best.value) best = { value, basket: combo };
          }
  return best;
}

export function generateCaravanConfig(
  rng: () => number,
  mode: "daily" | "practice",
  dateKey: string,
): CaravanConfig {
  // 1. Pick the target metric.
  const eligibleMetrics = categories.filter((c) => VALUE_METRICS.includes(c.slug));
  const metric = seededShuffle(eligibleMetrics, rng)[0];

  // 2. Eligible countries = those with a rank in this metric.
  const eligible = countries.filter((c) => ranks[c.iso3]?.[metric.slug] !== undefined);

  // 3. Pick 12 (random across the rank range gives a natural value spread).
  const picked = seededShuffle(eligible, rng).slice(0, SHELF_SIZE);

  // 4. Build items: value from rank, price convex in value with seeded jitter
  //    (jitter creates bargains/traps so greedy-by-value is NOT optimal).
  const items: CaravanItem[] = picked.map((c) => {
    const value = valueFromRank(ranks[c.iso3][metric.slug]);
    const jitter = 0.7 + rng() * 0.6; // 0.7 .. 1.3
    const price = Math.max(1, Math.round((Math.pow(value, 1.5) / PRICE_K) * jitter));
    return { iso3: c.iso3, value, price };
  });

  // 5. Budget between the 5 cheapest (always completable) and 5 priciest
  //    (can't buy the best five). frac sets the squeeze.
  const sortedPrices = items.map((i) => i.price).slice().sort((a, b) => a - b);
  const sumCheapest5 = sortedPrices.slice(0, BUY_COUNT).reduce((a, b) => a + b, 0);
  const sumPriciest5 = sortedPrices.slice(-BUY_COUNT).reduce((a, b) => a + b, 0);
  const frac = 0.35 + rng() * 0.15; // 0.35 .. 0.5
  const budget = Math.round(sumCheapest5 + frac * (sumPriciest5 - sumCheapest5));

  // 6. Provable optimum.
  const { value: optimalValue, basket: optimalBasket } = bestBasket(items, budget);

  return {
    metricSlug: metric.slug,
    metricLabel: metric.label,
    metricClarifier: metric.clarifier,
    items,
    budget,
    buyCount: BUY_COUNT,
    optimalValue,
    optimalBasket,
    mode,
    dateKey,
  };
}
