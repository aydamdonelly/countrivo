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

const FLAG_KEY = 'leaderboard_flag';
/** "private" remembers an explicit choice to keep the flag hidden. */
export type RememberedFlag = string | 'private' | null;

export function rememberedLeaderboardFlag(): RememberedFlag {
  const value = getStorageItem<unknown>(FLAG_KEY, null);
  return typeof value === 'string' && (value === 'private' || /^[A-Z]{3}$/.test(value)) ? value : null;
}

export function rememberLeaderboardFlag(iso3: string): void {
  setStorageItem(FLAG_KEY, iso3 && /^[A-Z]{3}$/.test(iso3) ? iso3 : 'private');
}
