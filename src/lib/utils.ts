export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * The compact tiers. Trillions exist because the largest figure the product prints is the
 * US economy at 27,292,170,793,214, and `$27292.2B` is not a number a reader can hold.
 */
const TIERS: readonly (readonly [number, string])[] = [
  [1e12, "T"],
  [1e9, "B"],
  [1e6, "M"],
  [1e3, "K"],
];

function tierOf(abs: number): (readonly [number, string]) | null {
  for (const tier of TIERS) if (abs >= tier[0]) return tier;
  return null;
}

/**
 * The one house figure: `27.3T`, `1.4B`, `124.5M`, `5.5K`, `900`, `4.56`, `0.49`.
 *
 * Two rules the raw data forces. Magnitude is taken from the absolute value, so a negative
 * figure (foreign investment runs down to -343,402,798,888) prints as `-343.4B` and not as
 * eleven grouped digits. Below a thousand the value is capped at two decimals, because the
 * source carries up to eighteen of them and `14.986443 % of GDP` and `899.999976 arrivals`
 * are noise, not precision; trailing zeros are dropped, so a fertility of 6.1 stays `6.1`
 * while 4.556 keeps the second decimal that separates it from its neighbours.
 */
export function formatNumber(n: number): string {
  const abs = Math.abs(n);
  const tier = tierOf(abs);
  if (!tier) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  // 999,999 rounds to `1000.0K`, which belongs one tier up.
  const promoted = Number((abs / tier[0]).toFixed(1)) >= 1000 ? (tierOf(tier[0] * 1000) ?? tier) : tier;
  return `${(n / promoted[0]).toFixed(1)}${promoted[1]}`;
}

/**
 * A figure with its unit, as every page and every board prints it: `124.5M people`,
 * `84.0 years`, `41.6%`, `15.0% of GDP`, `$27.3T`, `-$343.4B`, `652.2K km²`.
 * The percent family keeps the sign welded to the number and one decimal, so the three
 * `% of GDP` categories read as a percentage first and a qualifier second.
 */
export function formatStat(value: number, unit: string): string {
  if (unit.startsWith("%")) return `${value.toFixed(1)}${unit}`;
  if (unit === "years") return `${value.toFixed(1)} ${unit}`;
  // A negative figure keeps its sign in front of the currency: `-$343.4B`, never `$-343.4B`.
  if (unit === "USD") return value < 0 ? `-$${formatNumber(-value)}` : `$${formatNumber(value)}`;
  return `${formatNumber(value)} ${unit}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
