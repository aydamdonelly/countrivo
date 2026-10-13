/*
 * How Stat Guesser prints its numbers and lines (concept 5.6). Server safe, no React.
 * Words for the big tiers (`5 million`, `1.44 billion`), spaced thousands below a million
 * (`513 000 km²`), three significant figures throughout, so a value reads like something
 * a person would say rather than a data dump.
 */
import { isMagnitude, statYear, type GuessStat } from "@/lib/game-logic/stat-guesser/engine";

const STAT_LINE: Record<GuessStat, string> = {
  population: "Population",
  "area-km2": "Area",
  gdp: "GDP",
  "gdp-per-capita": "GDP per person",
  "urban-population-pct": "Share living in cities",
  "internet-users-pct": "Share of people online",
  "forest-coverage-pct": "Forest cover, share of land",
};

/** `Population, 2023`. */
export function statLine(stat: GuessStat): string {
  const year = statYear(stat);
  return year ? `${STAT_LINE[stat]}, ${year}` : STAT_LINE[stat];
}

/** The short stat name for result rows: `Population`, `GDP per person`. */
export function statName(stat: GuessStat): string {
  return STAT_LINE[stat];
}

function spaced(n: number): string {
  return Math.round(n).toLocaleString("en-US").replace(/,/g, " ");
}

/** `5`, `10.5`, `1.44`: three significant figures, no trailing zeros. */
function sig3(n: number): string {
  return String(Number(n.toPrecision(3)));
}

function bare(value: number): string {
  const v = Number(value.toPrecision(3));
  const abs = Math.abs(v);
  if (abs >= 1e12) return `${sig3(v / 1e12)} trillion`;
  if (abs >= 1e9) return `${sig3(v / 1e9)} billion`;
  if (abs >= 1e6) return `${sig3(v / 1e6)} million`;
  if (abs >= 1000) return spaced(v);
  if (abs >= 10) return String(Math.round(value));
  return String(Number(value.toFixed(2)));
}

/**
 * A value as the board prints it: `5 million`, `$15.9 billion`, `513 000 km²`, `42.7 %`.
 * Percentages keep one decimal for a true value and none for a ruler step.
 */
export function valueText(stat: GuessStat, value: number): string {
  if (!isMagnitude(stat)) {
    const shown = Number.isInteger(value) ? String(value) : value.toFixed(1);
    return `${shown} %`;
  }
  const body = bare(value);
  if (stat === "gdp" || stat === "gdp-per-capita") return `$${body}`;
  if (stat === "area-km2") return `${body} km²`;
  return body;
}

/** `2.1 times too low`, `14 times too high`, `6 points too high`, `Spot on`. */
export function gapText(stat: GuessStat, guess: number, actual: number): string {
  if (isMagnitude(stat)) {
    const r = guess / actual;
    if (!(r > 0) || Math.abs(Math.log10(r)) < Math.log10(1.05)) return "Spot on";
    const k = r >= 1 ? r : 1 / r;
    const times = k < 10 ? k.toFixed(1) : spaced(k);
    return `${times} times too ${r > 1 ? "high" : "low"}`;
  }
  const d = guess - actual;
  const n = Math.round(Math.abs(d));
  if (n === 0) return "Spot on";
  return `${n} ${n === 1 ? "point" : "points"} too ${d > 0 ? "high" : "low"}`;
}

/** `Portugal, Greece and Czechia are here too.` */
export function contextLine(names: readonly string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return `${names[0]} is here too.`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} are here too.`;
}

/** The one-word read of a finished board against par 300. */
export function gradeWord(total: number): string {
  if (total >= 450) return "Sharp.";
  if (total >= 300) return "Beat par.";
  return "Short of par.";
}
