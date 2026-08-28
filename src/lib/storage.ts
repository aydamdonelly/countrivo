const STORAGE_PREFIX = "countrivo_";

// Some game states hold a Set/Map (e.g. country-draft's usedCategories). Plain
// JSON drops those to {}; these (de)serialize them. Backward-compatible: values
// without a marker pass straight through.
const SET_TAG = "__ck_set";
const MAP_TAG = "__ck_map";

function replaceTypes(_key: string, value: unknown): unknown {
  if (value instanceof Set) return { [SET_TAG]: [...value] };
  if (value instanceof Map) return { [MAP_TAG]: [...value] };
  return value;
}

function reviveTypes(_key: string, value: unknown): unknown {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const v = value as Record<string, unknown>;
    if (Array.isArray(v[SET_TAG])) return new Set(v[SET_TAG] as unknown[]);
    if (Array.isArray(v[MAP_TAG])) return new Map(v[MAP_TAG] as [unknown, unknown][]);
  }
  return value;
}

export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw, reviveTypes) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value, replaceTypes));
  } catch {
    // Quota exceeded / storage disabled (private mode, locked-down WebView).
    // Never let a persistence failure crash the live game.
  }
}

export function removeStorageItem(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // localStorage may be unavailable (private mode)
  }
}

export function isDailyCompleted(gameSlug: string, dateKey: string): boolean {
  return getStorageItem<boolean>(`daily_${gameSlug}_${dateKey}_completed`, false);
}

export function saveDailyResult(gameSlug: string, dateKey: string, result: unknown): void {
  setStorageItem(`daily_${gameSlug}_${dateKey}_completed`, true);
  setStorageItem(`daily_${gameSlug}_${dateKey}_result`, result);
}

export function getDailyResult<T>(gameSlug: string, dateKey: string): T | null {
  return getStorageItem<T | null>(`daily_${gameSlug}_${dateKey}_result`, null);
}

// ─── Daily Lockout (for guest users) ─────────────────────────────────

export interface DailyLockoutEntry {
  score: string;
  scoreDisplay: string;
  timestamp: number;
}

// Lockout + in-progress keys are scoped by the daily "edition" (see
// getDailyEdition). When the admin re-rolls, the edition changes, so old
// lockout/progress keys are simply no longer read — every player gets a clean,
// replayable board for the new puzzle without any explicit wipe.
export function getDailyLockout(gameSlug: string, dateKey: string, edition: string): DailyLockoutEntry | null {
  return getStorageItem<DailyLockoutEntry | null>(`lockout_${gameSlug}_${dateKey}_e${edition}`, null);
}

export function setDailyLockout(gameSlug: string, dateKey: string, entry: DailyLockoutEntry, edition: string): void {
  setStorageItem(`lockout_${gameSlug}_${dateKey}_e${edition}`, entry);
  // Mark "played today" under the edition-agnostic key the home progress ring,
  // header counter, streak nudge, and game-chaining actually read. (Previously
  // only the unused useDailyChallenge hook wrote this, so the habit loop was dead.)
  setStorageItem(`daily_${gameSlug}_${dateKey}_completed`, true);
  // The game is over: the in-progress blob is now superseded by the lockout.
  clearDailyProgress(gameSlug, dateKey, edition);
}

// ─── In-Progress Persistence (anti-cheat: resume on reload) ──────────

export function dailyProgressKey(gameSlug: string, dateKey: string, edition: string): string {
  return `progress_${gameSlug}_${dateKey}_e${edition}`;
}

export function clearDailyProgress(gameSlug: string, dateKey: string, edition: string): void {
  removeStorageItem(dailyProgressKey(gameSlug, dateKey, edition));
}
