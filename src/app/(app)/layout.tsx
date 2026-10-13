import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { Header } from '@/ui/header';
import { getClock } from '@/server/clock';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const [store, clock] = await Promise.all([cookies(), getClock()]);
  const yesterday = new Date(`${clock.dateKey}T12:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);
  let streak = 0;
  try {
    const value: unknown = JSON.parse(store.get('cv_streak')?.value ?? 'null');
    if (value && typeof value === 'object' && 'count' in value && typeof value.count === 'number' && 'day' in value && (value.day === clock.dateKey || value.day === yesterdayKey)) streak = value.count;
  } catch { /* A cleared or older cookie starts a fresh device streak. */ }
  return <div className="frame table-frame"><Header streak={streak} />{children}</div>;
}
