import type { Metadata } from 'next';
import { getClock } from '@/server/clock';
import { TableHome } from '@/features/home/table-home';
import { TABLE_GAMES } from '@/content/table';
import { SiteFoot } from '@/ui/site-foot';
import { GameRow } from '@/ui/game-row';
import { StatIcon } from '@/ui/icons/stat';
import { Flag } from '@/ui/flag';
import { PinIcon } from '@/ui/icons/pin';
import '@/features/seo/urban-geography.css';

/**
 * /practice owns "unlimited geography games" (Search Console, November 2026); /games stays
 * the hub for "free geography games". The count comes from the game list.
 */
export const metadata: Metadata = {
  title: 'Unlimited Geography Games: Free Practice, No Account',
  description: `Unlimited geography games: fresh practice boards for all ${TABLE_GAMES.length} Countrivo games, from GeoWordle and Pinpoint to flag and capital quizzes. Free, no account, no leaderboard.`,
  alternates: { canonical: 'https://countrivo.com/practice' },
};

export default async function Practice() {
  const clock = await getClock();
  return <><TableHome games={TABLE_GAMES} done={{}} progress={{}} opening="country-draft" dateKey={clock.dateKey} resetAt={clock.resetAt} serverNow={clock.now} practice /><section className="practice-topics ls"><h2 className="t-h2">Explore a topic</h2><GameRow href="/world-map-quiz" title="World Map Quiz" meta="Five countries a round · Blank world map" lead={<PinIcon size={24} />} /><GameRow href="/practice/europe-flags" title="Flags of Europe" meta="Ten flags · Four European names each" lead={<Flag iso2="fr" size="xs" alt="" />} /><GameRow href="/practice/urban-geography" title="How urban is the world?" meta="Compare countries, then try the ruler" lead={<StatIcon slug="urban-population-pct" size={24} />} /></section><SiteFoot feedback={false} /></>;
}
