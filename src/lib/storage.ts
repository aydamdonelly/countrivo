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
