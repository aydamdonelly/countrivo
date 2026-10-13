import type { Metadata } from 'next';
import { getClock } from '@/server/clock';
import { TableHome } from '@/features/home/table-home';
import { TABLE_GAMES } from '@/content/table';
import { SiteFoot } from '@/ui/site-foot';
export const metadata: Metadata = {title:'Practice geography games',description:'Unlimited geography practice. Eight games, fresh boards, no account.'};
export default async function Practice() {
  const clock = await getClock();
  return <><h1 className="sr-only">Practice geography games</h1><TableHome games={TABLE_GAMES} done={{}} progress={{}} opening="country-draft" dateKey={clock.dateKey} resetAt={clock.resetAt} serverNow={clock.now} practice /><SiteFoot /></>;
}
