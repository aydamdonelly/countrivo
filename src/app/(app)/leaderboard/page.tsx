import type { Metadata } from 'next';
import { LeaderboardPage } from '@/features/social/leaderboard-page';
import { SiteFoot } from '@/ui/site-foot';
export const metadata: Metadata = {title: "Today's leaderboards", robots:{index:false,follow:true}};
export default async function Leaderboard({searchParams}: {searchParams:Promise<{game?:string;date?:string}>}) {
  const params=await searchParams;
  return <><LeaderboardPage slug={params.game ?? 'country-draft'} date={params.date} /><SiteFoot /></>;
}
