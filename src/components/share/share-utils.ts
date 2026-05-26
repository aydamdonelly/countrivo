/**
 * Shared formatters for the share-grid family. The middle-dot `·` (U+00B7)
 * is the brand bracket — never substitute `•`.
 */

/** Format a YYYY-MM-DD date key as `DD · MM · YY` (brand-bracket separator). */
export function formatBrandDate(dateKey: string): string {
  // Practice runs use a `practice-...` key; fall back to today.
  const isIsoLike = /^\d{4}-\d{2}-\d{2}$/.test(dateKey);
  const d = isIsoLike ? new Date(`${dateKey}T00:00:00`) : new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  return `${dd} · ${mm} · ${yy}`;
}

/** "1st", "2nd", "12th", "23rd" — English ordinals. */
export function ordinal(n: number): string {
  const abs = Math.abs(n);
  const lastTwo = abs % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;
  const last = abs % 10;
  if (last === 1) return `${n}st`;
  if (last === 2) return `${n}nd`;
  if (last === 3) return `${n}rd`;
  return `${n}th`;
}
