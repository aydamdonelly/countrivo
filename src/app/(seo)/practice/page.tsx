import type { Metadata } from 'next';
import { getClock } from '@/server/clock';
import { TableHome } from '@/features/home/table-home';
import { TABLE_GAMES } from '@/content/table';
import { SiteFoot } from '@/ui/site-foot';
import { GameRow } from '@/ui/game-row';
import { StatIcon } from '@/ui/icons/stat';
import { Flag } from '@/ui/flag';
import '@/features/seo/urban-geography.css';
export const metadata: Metadata = {title:'Practice geography games',description:'Unlimited geography practice. Eight games, fresh boards, no account.'};
export default async function Practice() {
  const clock = await getClock();
  return <><h1 className="sr-only">Practice geography games</h1><TableHome games={TABLE_GAMES} done={{}} progress={{}} opening="country-draft" dateKey={clock.dateKey} resetAt={clock.resetAt} serverNow={clock.now} practice /><section className="practice-topics"><h2 className="t-h2">Explore a topic</h2><GameRow href="/practice/europe-flags" title="Flags of Europe" meta="Ten flags · Four European names each" lead={<Flag iso2="fr" size="xs" alt="" />} /><GameRow href="/practice/urban-geography" title="How urban is the world?" meta="Compare countries, then try the ruler" lead={<StatIcon slug="urban-population-pct" size={24} />} /></section><SiteFoot /></>;
}
