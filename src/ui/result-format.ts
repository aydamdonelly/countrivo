/** Small, deterministic text helpers for the result screen (same output on server and client). */

const WORDS = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"] as const;

/** `seven` for 7; undefined outside 2 to 12, where the sub line is left out. */
export function numberWord(n: number): string | undefined {
  return Number.isInteger(n) && n >= 2 && n <= 12 ? WORDS[n] : undefined;
}

/** `1st`, `2nd`, `3rd`, `4th`, `11th`, `21st`. */
export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
}

/** `Wednesday 25 November` for a Berlin board date key. */
export function boardDate(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00Z`);
  if (!Number.isFinite(date.getTime())) return dateKey;
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(date).replace(",", "");
}

/** `About 2 minutes` becomes `2 min`, `About 90 seconds` becomes `90 sec`. */
export function shortDuration(text: string): string {
  const m = text.match(/(\d+)\s*(minute|second)/i);
  return m ? `${m[1]} ${m[2].toLowerCase() === "minute" ? "min" : "sec"}` : text;
}

const DEFAULT_UNITS: Record<string, string> = {
  "country-draft": "/195", "geo-wordle": "guesses", pinpoint: "/1,200", "flag-quiz": "flags",
  "higher-or-lower": "/13", "stat-guesser": "/600", "blind-pick": "vs best", "speed-flags": "flags",
};

/** A displayed daily score split for the day strip: `142 / 195` to `142` and `/195`. */
export function stripScore(slug: string, display: string | undefined): { value: string; unit: string } {
  const unit = DEFAULT_UNITS[slug] ?? "";
  if (!display) return { value: "Done", unit: "" };
  const text = display.trim();
  if (slug === "geo-wordle") return { value: text.replace(/\s+/g, "").replace(/guess(es)?$/i, ""), unit: "guesses" };
  if (slug === "blind-pick") return { value: text, unit: "vs best" };
  const fraction = text.match(/^([+]?\d[\d,  ]*?)\s*(?:\/|of)\s*(\d[\d,  ]*)/i);
  if (fraction) return { value: fraction[1].trim(), unit: `/${fraction[2].trim()}` };
  const plain = text.match(/^([+]?\d[\d,  ]*)\s*(.*)$/);
  if (plain) return { value: plain[1].trim(), unit: plain[2].trim() || unit };
  return { value: text, unit: "" };
}
