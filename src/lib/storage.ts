const STORAGE_PREFIX = "countrivo_";

export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
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

export function getDailyLockout(gameSlug: string, dateKey: string): DailyLockoutEntry | null {
  return getStorageItem<DailyLockoutEntry | null>(`lockout_${gameSlug}_${dateKey}`, null);
}

export function setDailyLockout(gameSlug: string, dateKey: string, entry: DailyLockoutEntry): void {
  setStorageItem(`lockout_${gameSlug}_${dateKey}`, entry);
  // The game is over: the in-progress blob is now superseded by the lockout.
  clearDailyProgress(gameSlug, dateKey);
}

// ─── In-Progress Persistence (anti-cheat: resume on reload) ──────────

export function dailyProgressKey(gameSlug: string, dateKey: string): string {
  return `progress_${gameSlug}_${dateKey}`;
}

export function clearDailyProgress(gameSlug: string, dateKey: string): void {
  removeStorageItem(dailyProgressKey(gameSlug, dateKey));
}
