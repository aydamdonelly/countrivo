/*
 * The nine statistics Higher or Lower plays on (concept 5.5): at least 180 sovereign entries
 * and no caveat flag. Tourist arrivals has only 163 sovereign entries and is left out. Each
 * one carries how its value is printed on the card (`5.52 million`), in the comparison line
 * (`5.52 million`, `84.5 years`), the unit line under the value (`People`) and the word the
 * share text uses (`on population`). Pure: no React, no data imports.
 */

export const HOL_STATS = [
  "population",
  "area-km2",
  "gdp",
  "gdp-per-capita",
  "life-expectancy",
  "urban-population-pct",
  "internet-users-pct",
  "forest-coverage-pct",
  "fertility-rate",
] as const;

export type HoLStat = (typeof HOL_STATS)[number];

export function isHoLStat(slug: string): slug is HoLStat {
  return (HOL_STATS as readonly string[]).includes(slug);
}

type Shape = "count" | "money" | "money-each" | "years" | "share" | "rate";

interface StatMeta {
  /** The label on the stat line: `Population`. */
  label: string;
  /** The unit line under a card value: `People`. */
  unit: string;
  /** The share text: `11 of 13 on population`. */
  noun: string;
  shape: Shape;
}

const META: Record<HoLStat, StatMeta> = {
  population: { label: "Population", unit: "People", noun: "population", shape: "count" },
  "area-km2": { label: "Total area", unit: "Square kilometres", noun: "total area", shape: "count" },
  gdp: { label: "Total GDP", unit: "US dollars", noun: "total GDP", shape: "money" },
  "gdp-per-capita": { label: "GDP per person", unit: "US dollars per person", noun: "GDP per person", shape: "money-each" },
  "life-expectancy": { label: "Life expectancy", unit: "Years at birth", noun: "life expectancy", shape: "years" },
  "urban-population-pct": { label: "Urban share", unit: "Share of people in cities", noun: "urban share", shape: "share" },
  "internet-users-pct": { label: "Internet users", unit: "Share of people online", noun: "internet use", shape: "share" },
  "forest-coverage-pct": { label: "Forest cover", unit: "Share of land under forest", noun: "forest cover", shape: "share" },
  "fertility-rate": { label: "Fertility", unit: "Births per woman", noun: "fertility", shape: "rate" },
};

export function statMeta(stat: HoLStat): StatMeta {
  return META[stat];
}

/** `1280` as `1 280` (the copy voice spaces its thousands). */
function spaced(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Three significant figures for a mantissa in [1, 1000): `5.52`, `10.5`, `385`. */
function sig3(x: number): string {
  if (x >= 100) return x.toFixed(0);
  if (x >= 10) return x.toFixed(1);
  return x.toFixed(2);
}

const WORD_TIERS: readonly (readonly [number, string])[] = [
  [1e12, "trillion"],
  [1e9, "billion"],
  [1e6, "million"],
  [1e3, "thousand"],
];

/**
 * `5.52 million`, `1.43 billion`, `385 thousand`, `9 816`. Three significant figures from ten
 * thousand up (a value that rounds to 1000 of a tier steps up one), the exact grouped
 * integer below. Three significant figures can never print two values 3% apart alike, which
 * is why the generator's 3% rule is enough to keep every revealed pair readable.
 */
function words(v: number, floor: number): string {
  const abs = Math.abs(v);
  if (abs >= floor) {
    for (let t = 0; t < WORD_TIERS.length; t += 1) {
      const [size, word] = WORD_TIERS[t];
      if (abs < size) continue;
      const m = sig3(abs / size);
      if (Number(m) >= 1000 && t > 0) {
        const [up, upWord] = WORD_TIERS[t - 1];
        return `${sig3(abs / up)} ${upWord}`;
      }
      return `${m} ${word}`;
    }
  }
  return spaced(abs);
}

/** A share: `81.2%`, `9.55%`, `0.42%`. */
function share(v: number): string {
  if (v >= 10) return `${v.toFixed(1)}%`;
  if (v >= 1) return `${v.toFixed(2)}%`;
  return `${Number(v.toPrecision(3))}%`;
}

/** The value as the card prints it, in `.t-score-l`: `5.52 million`, `$54 217`, `84.5`. */
export function cardValue(stat: HoLStat, v: number): string {
  switch (META[stat].shape) {
    case "count":
      return words(v, 1e4);
    case "money":
      return `$${words(v, 1e6)}`;
    case "money-each":
      return `$${spaced(v)}`;
    case "years":
      return v.toFixed(1);
    case "share":
      return share(v);
    case "rate":
      return v.toFixed(2);
  }
}

/** The value inside a sentence, with its unit where the card leaves it to the unit line. */
export function lineValue(stat: HoLStat, v: number): string {
  const card = cardValue(stat, v);
  if (stat === "area-km2") return `${card} km²`;
  if (stat === "life-expectancy") return `${card} years`;
  if (stat === "fertility-rate") return `${card} births per woman`;
  return card;
}
