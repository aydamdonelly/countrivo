import 'server-only';
import type { gameDatabase } from './anonymous-identity';

export interface UsageCount {
  event: string;
  game: string | null;
  mode: string | null;
  source: string;
  action: string | null;
  outcome: string | null;
  target: string | null;
  target_game: string | null;
  total: number;
}
export interface UsageRunCount {
  game: string;
  mode: string;
  started: number;
  completed: number;
  unfinished: number;
  average_score: number | null;
}
export interface UsageSummary {
  events: UsageCount[];
  runs: UsageRunCount[];
  devices: number;
  received: number;
  first_event: string | null;
}

function record(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value); }
const nullableText = (value: unknown) => value === null || typeof value === 'string';
function isSummary(value: unknown): value is UsageSummary {
  return record(value) && typeof value.devices === 'number' && typeof value.received === 'number' && nullableText(value.first_event)
    && Array.isArray(value.events) && value.events.every(row => record(row) && typeof row.event === 'string' && typeof row.source === 'string' && typeof row.total === 'number' && ['game','mode','action','outcome','target','target_game'].every(key => nullableText(row[key])))
    && Array.isArray(value.runs) && value.runs.every(row => record(row) && typeof row.game === 'string' && typeof row.mode === 'string' && ['started','completed','unfinished'].every(key => typeof row[key] === 'number') && (row.average_score === null || typeof row.average_score === 'number'));
}

export async function usageStatistics(db: ReturnType<typeof gameDatabase>, days: number): Promise<UsageSummary | null> {
  try {
    const { data, error } = await db.rpc('countrivo_usage_summary', { p_days: days })
      .abortSignal(AbortSignal.timeout(3500));
    return !error && isSummary(data) ? data : null;
  } catch { return null; }
}
