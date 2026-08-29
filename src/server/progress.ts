/*
 * The resume and done cookies (blueprint 8.6, 9.1 step 7). Pure parsing on the server; the
 * host writes the cookies through document.cookie (P3's persist.ts uses the encoders here).
 *
 *   cv_p_{slug} = {dateKey}|{edition}|{startedAtMsBase36}|{log}
 *   cv_done     = JSON { d: dateKey, e: edition, g: { [slug]: scoreLabel } }
 *
 * Both are discarded when the date or the edition differ. Nothing else is read from cookies.
 */

/** Anything with `get(name)` returning `{ value }`: next/headers cookies() or a NextRequest's cookies. */
export interface CookieReader {
  get(name: string): { value: string } | undefined;
}

/** A module codec's decoder; readProgress discards a log the codec cannot decode. */
export interface LogDecoder {
  dec(log: string): unknown;
}

export const DONE_COOKIE = "cv_done";
/** Hard cap on a progress cookie; the host stops persisting rather than truncate mid-token. */
export const PROGRESS_MAX_BYTES = 900;

export function progressCookieName(slug: string): string {
  return `cv_p_${slug}`;
}

export interface ProgressCookie {
  dateKey: string;
  edition: string;
  /** Epoch ms of the first action. */
  startedAt: number;
  /** The encoded action log ("" when fresh). */
  log: string;
}

export function encodeProgress(p: ProgressCookie): string {
  return `${p.dateKey}|${p.edition}|${Math.max(0, Math.floor(p.startedAt)).toString(36)}|${p.log}`;
}

export function parseProgress(raw: string): ProgressCookie | null {
  const first = raw.indexOf("|");
  const second = first < 0 ? -1 : raw.indexOf("|", first + 1);
  const third = second < 0 ? -1 : raw.indexOf("|", second + 1);
  if (third < 0) return null;
  const dateKey = raw.slice(0, first);
  const edition = raw.slice(first + 1, second);
  const startedAt = parseInt(raw.slice(second + 1, third), 36);
  const log = raw.slice(third + 1);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !Number.isFinite(startedAt) || startedAt <= 0) return null;
  return { dateKey, edition, startedAt, log };
}

export interface ResumedProgress {
  log: string;
  /** ISO timestamp for HostProps.startedAt (keeps the server's too_fast check honest across reloads). */
  startedAt: string;
}

/**
 * The resumable log of one game for today's board, or null when there is none, the date or
 * edition moved on, or the codec rejects it.
 */
export function readProgress(cookies: CookieReader, slug: string, dateKey: string, edition: string, codec?: LogDecoder): ResumedProgress | null {
  const raw = cookies.get(progressCookieName(slug))?.value;
  if (!raw) return null;
  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    value = raw;
  }
  const parsed = parseProgress(value);
  if (!parsed || parsed.dateKey !== dateKey || parsed.edition !== edition) return null;
  if (codec) {
    try {
      codec.dec(parsed.log);
    } catch {
      return null;
    }
  }
  return { log: parsed.log, startedAt: new Date(parsed.startedAt).toISOString() };
}

export interface DoneCookie {
  d: string;
  e: string;
  g: Record<string, string>;
}

export function encodeDone(done: DoneCookie): string {
  return JSON.stringify({ d: done.d, e: done.e, g: done.g });
}

function isDoneCookie(v: unknown): v is DoneCookie {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  if (typeof o.d !== "string" || typeof o.e !== "string" || typeof o.g !== "object" || o.g === null) return false;
  return Object.values(o.g as Record<string, unknown>).every((s) => typeof s === "string");
}

/** `{ [slug]: scoreLabel }` of the dailies finished today on this device; `{}` otherwise. */
export function readDone(cookies: CookieReader, dateKey: string, edition: string): Record<string, string> {
  const raw = cookies.get(DONE_COOKIE)?.value;
  if (!raw) return {};
  let text = raw;
  try {
    text = decodeURIComponent(raw);
  } catch {
    text = raw;
  }
  try {
    const parsed: unknown = JSON.parse(text);
    if (!isDoneCookie(parsed) || parsed.d !== dateKey || parsed.e !== edition) return {};
    return { ...parsed.g };
  } catch {
    return {};
  }
}

/* ────────────────────────────────────────────────────────────────────────────────────────
 * P3 section (the play frame's codec helpers). Pure, no I/O; src/features/play/persist.ts
 * uses them from the client and the play page from the server. Append-only below this line.
 * ──────────────────────────────────────────────────────────────────────────────────────── */

/** `cv_done` with one more game recorded; a cookie from another day or edition starts fresh. */
export function mergeDone(existing: Record<string, string>, dateKey: string, edition: string, slug: string, scoreLabel: string): DoneCookie {
  return { d: dateKey, e: edition, g: { ...existing, [slug]: scoreLabel } };
}

/** True when an encoded progress value fits the cookie budget (blueprint 8.6). */
export function progressWithinBudget(encoded: string): boolean {
  return new TextEncoder().encode(encoded).length <= PROGRESS_MAX_BYTES;
}
