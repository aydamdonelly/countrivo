import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getAllGames, getGameBySlug } from '@/lib/data/games';
import { getClock } from '@/server/clock';
import { getEdition } from '@/server/edition';
import { readDone, readProgress } from '@/server/progress';
import { deviceOpenRows, getDeviceDailyRuns } from '@/server/anonymous-runs';
import { DayAtlas } from "@/features/home/day-atlas";
import { TableHome } from '@/features/home/table-home';
import { DailyTable } from '@/features/home/daily-table';
import { TABLE_GAMES } from '@/content/table';
import { SiteFoot } from '@/ui/site-foot';
import { YesterdayAnswers } from '@/features/home/yesterday-answers';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: {absolute: 'Countrivo: Free Geography Games & Daily Country Puzzles'},
  description: 'Six short geography games. New boards every day. Country Draft, GeoWordle, Pinpoint and more. Play without an account.',
  alternates: {canonical: 'https://countrivo.com'},
};
interface Props { searchParams: Promise<{game?: string; mode?: string}>; }
export default async function Home({searchParams}: Props) {
  const [clock, edition, store, params] = await Promise.all([getClock(), getEdition(), cookies(), searchParams]);
  const [runs, openRuns] = await Promise.all([getDeviceDailyRuns(clock.dateKey, edition), deviceOpenRows(clock.dateKey, edition)]);
  const done = readDone(store, clock.dateKey, edition);
  for (const run of runs) done[run.gameSlug] = run.scoreDisplay;
  const games = TABLE_GAMES.filter((game) => getGameBySlug(game.slug)?.availableModes.includes('daily'));
  const progress: Record<string,string> = {};
  for (const run of openRuns) if (!done[run.game_slug]) progress[run.game_slug] = 'Board in progress';
  for(const game of games) if (!done[game.slug] && readProgress(store, game.slug, clock.dateKey, edition)?.log) progress[game.slug] = 'Board in progress';
  const chosen = games.find((game) => game.slug === params.game);
  const resume = games.find((game) => progress[game.slug]);
  const first = chosen ?? resume ?? games.find((game) => !done[game.slug]) ?? games[0];
  const ordered = first ? [first, ...games.filter((game) => game.slug !== first.slug)] : games;
  const boards = Object.fromEntries(games.map((game) => [game.slug, <DailyTable key={game.slug} slug={game.slug} dateKey={clock.dateKey} />]));
  const jsonLd = {'@context':'https://schema.org','@type':'ItemList',name:'Countrivo Geography Games',itemListElement:getAllGames().map((game,i)=>({'@type':'ListItem',position:i+1,name:game.title,url:`https://countrivo.com${game.route}`}))};
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}} />
    <h1 className="sr-only">Countrivo: daily geography games</h1>
    <TableHome games={ordered} done={done} progress={progress} opening={first?.slug ?? 'country-draft'} dateKey={clock.dateKey} resetAt={clock.resetAt} serverNow={clock.now} boards={boards} atlas={games.every(game=>Boolean(done[game.slug]))?<DayAtlas key="day-atlas" runs={runs} />:null} yesterday={<YesterdayAnswers key="yesterday" />} />
    <SiteFoot />
  </>;
}
