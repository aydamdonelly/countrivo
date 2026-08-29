/**
 * Shared formatters for the share-grid family. The middle-dot `·` (U+00B7)
 * is the brand bracket — never substitute `•`.
 */

const SITE_URL = "https://countrivo.com";

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

/** Wordle-style daily number: days since the Countrivo epoch (2026-01-01). */
export function dailyNumber(dateKey: string): number {
  const EPOCH = Date.parse("2026-01-01T00:00:00Z");
  const isIso = /^\d{4}-\d{2}-\d{2}$/.test(dateKey);
  const day = isIso ? Date.parse(`${dateKey}T00:00:00Z`) : Date.now();
  return Math.max(1, Math.floor((day - EPOCH) / 86_400_000) + 1);
}

/**
 * Unified SPOILER-SAFE share grid for any game — the viral artifact.
 *   Countrivo <Game> #<dayNumber> <score>
 *   🟩🟩🟩🟩🟩🟩🟩⬛⬛⬛        (correct vs missed — never the answer)
 *
 *   https://countrivo.com
 * The emoji row is omitted for open-ended/streak scores (no fixed max); the
 * header still carries the brag. The full https:// link must be the LAST line
 * so it auto-links and survives re-sharing.
 */
export function buildShareGrid(opts: {
  gameTitle: string;
  gameSlug?: string;
  scoreDisplay: string;
  numericScore?: number;
  maxScore?: number;
  dateKey: string;
  /** Practice boards are random, so they carry no daily number. */
  practice?: boolean;
}): string {
  const { gameTitle, gameSlug, scoreDisplay, numericScore, maxScore, dateKey, practice } = opts;
  const lines = [practice
    ? `Countrivo ${gameTitle} practice ${scoreDisplay}`
    : `Countrivo ${gameTitle} #${dailyNumber(dateKey)} ${scoreDisplay}`];
  if (
    typeof numericScore === "number" &&
    typeof maxScore === "number" &&
    maxScore > 0 &&
    maxScore <= 25
  ) {
    const correct = Math.max(0, Math.min(Math.round(numericScore), maxScore));
    lines.push("🟩".repeat(correct) + "⬛".repeat(maxScore - correct));
  }
  lines.push("", gameShareUrl(gameSlug));
  return lines.join("\n");
}

/**
 * The URL that goes at the bottom of a share.
 *
 * Always the GAME's own page, never the bare homepage. A shared result is the
 * only thing that manufactures branded search demand — "worldle" alone carries
 * ~995k of Worldle's ~1.0M monthly organic visits — and a homepage link builds
 * exactly one brand token while a per-game link builds one per game. The link
 * must stay a full https:// URL on its own final line so it auto-links in
 * iMessage / WhatsApp / X and survives re-sharing.
 */
export function gameShareUrl(gameSlug?: string): string {
  return gameSlug ? `${SITE_URL}/games/${gameSlug}` : SITE_URL;
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
