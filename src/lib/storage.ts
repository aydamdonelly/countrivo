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

// ─── Daily lockout belt ───────────────────────────────────────────────
// The play frame resolves lockouts from the cv_done cookie and the server run; it
// still writes this entry on completion so a rollback to the previous build keeps
// its lockouts. Nothing in this tree reads it.

export interface DailyLockoutEntry {
  score: string;
  scoreDisplay: string;
  timestamp: number;
}

export function setDailyLockout(gameSlug: string, dateKey: string, entry: DailyLockoutEntry, edition: string): void {
  setStorageItem(`lockout_${gameSlug}_${dateKey}_e${edition}`, entry);
  // The edition-agnostic "played today" key the previous build's home and streak badge read.
  setStorageItem(`daily_${gameSlug}_${dateKey}_completed`, true);
  removeStorageItem(`progress_${gameSlug}_${dateKey}_e${edition}`);
}
