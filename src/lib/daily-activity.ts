export interface DailyActivity {
  days: string[];
  current: number;
  best: number;
  played: number;
}

export const EMPTY_ACTIVITY: DailyActivity = { days: [], current: 0, best: 0, played: 0 };
const DAY = 86_400_000;

export function dateOffset(dateKey: string, offset: number): string {
  return new Date(Date.parse(`${dateKey}T12:00:00Z`) + offset * DAY).toISOString().slice(0, 10);
}

function validDay(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(`${value}T12:00:00Z`))
    && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
}

export function activityFromDates(dates: readonly string[], today: string, previousBest = 0): DailyActivity {
  const unique = [...new Set(dates.filter(day => validDay(day) && day <= today))].sort();
  const found = new Set(unique);
  let current = 0;
  let cursor = found.has(today) ? today : dateOffset(today, -1);
  while (found.has(cursor)) { current++; cursor = dateOffset(cursor, -1); }
  let best = 0, sequence = 0, previous = '';
  for (const day of unique) {
    sequence = previous && dateOffset(previous, 1) === day ? sequence + 1 : 1;
    best = Math.max(best, sequence);
    previous = day;
  }
  return { days: unique.filter(day => day >= dateOffset(today, -34)), current,
    best: Math.max(best, Math.min(36_500, Math.max(0, previousBest))), played: unique.length };
}

export function readActivity(raw: string | undefined, today: string): DailyActivity {
  if (!raw || raw.length > 3000) return { ...EMPTY_ACTIVITY };
  try {
    const value: unknown = JSON.parse(decodeURIComponent(raw));
    if (!value || typeof value !== 'object' || !('days' in value) || !Array.isArray(value.days)
      || !value.days.every(validDay)) return { ...EMPTY_ACTIVITY };
    const best = 'best' in value && typeof value.best === 'number' && Number.isSafeInteger(value.best) ? value.best : 0;
    const parsed = activityFromDates(value.days, today, best);
    const latest = parsed.days[parsed.days.length - 1];
    if (latest && (latest === today || latest === dateOffset(today, -1)) && 'current' in value
      && typeof value.current === 'number' && Number.isSafeInteger(value.current)) {
      parsed.current = Math.max(parsed.current, Math.min(36_500, value.current));
    }
    if ('played' in value && typeof value.played === 'number' && Number.isSafeInteger(value.played))
      parsed.played = Math.max(parsed.played, Math.min(36_500, value.played));
    return parsed;
  } catch { return { ...EMPTY_ACTIVITY }; }
}

export function withCompletedDay(activity: DailyActivity, today: string): DailyActivity {
  if (activity.days.includes(today)) return activity;
  const next = activityFromDates([...activity.days, today], today, activity.best);
  next.current = activity.days.includes(dateOffset(today, -1)) ? activity.current + 1 : 1;
  next.best = Math.max(next.best, next.current);
  next.played = activity.played + 1;
  return next;
}

export function activityWeek(today: string): string[] {
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
  const monday = dateOffset(today, -((weekday + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => dateOffset(monday, index));
}
