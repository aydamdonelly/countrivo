import { getStorageItem, setStorageItem } from './storage';

const KEY = 'leaderboard_name';

function safeName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = value.normalize('NFKC').trim().replace(/\s+/g, ' ');
  return name.length >= 2 && name.length <= 20 && /^[\p{L}\p{N} ._'’-]+$/u.test(name) ? name : null;
}

export function rememberedLeaderboardName(): string {
  return safeName(getStorageItem<unknown>(KEY, null)) ?? '';
}

export function rememberLeaderboardName(name: string): void {
  const safe = safeName(name);
  if (safe) setStorageItem(KEY, safe);
}
