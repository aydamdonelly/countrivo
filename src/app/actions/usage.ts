'use server';

import { validateUsageBatch } from '@/lib/usage';
import { ensureDeviceId, gameDatabase } from '@/server/anonymous-identity';

export async function recordUsageBatch(input: unknown): Promise<boolean> {
  const events = validateUsageBatch(input);
  if (!events) return false;
  try {
    const device = await ensureDeviceId();
    const { error } = await gameDatabase().rpc('countrivo_record_usage', { p_device: device, p_events: events })
      .abortSignal(AbortSignal.timeout(2000));
    return !error;
  } catch { return false; }
}
