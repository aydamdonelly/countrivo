import { cookies } from 'next/headers';
import Link from 'next/link';
import { getDailyGames } from '@/lib/data/games';
import { TABLE_GAMES } from '@/content/table';
import { GameCard } from '@/ui/game-card';
import { PageTitle } from "@/ui/page-title";
import { SiteFoot } from "@/ui/site-foot";
import { getClock } from '@/server/clock';
import { getEdition } from '@/server/edition';
import { readDone } from '@/server/progress';
import { deviceDailyRows } from '@/server/anonymous-runs';

export async function GamesHub() {
  const [clock, edition, store] = await Promise.all([getClock(), getEdition(), cookies()]);
  const done = readDone(store, clock.dateKey, edition);
  for (const run of await deviceDailyRows(clock.dateKey, edition)) {
    if (run.score_display) done[run.game_slug] = run.score_display;
  }
  const registry = getDailyGames();
  const daily = TABLE_GAMES.filter((game)=>registry.some((g)=>g.slug===game.slug));
  const practice = TABLE_GAMES.filter((game)=>!daily.includes(game));
  return <>
    <PageTitle title="Daily games" />
    <section className="hub-section" aria-labelledby="hub-daily"><h2 id="hub-daily" className="sr-only">Daily games</h2><p className="hub-lead">New boards every day at midnight Berlin time. Everyone gets the same puzzles.</p>
      <div className="game-index">{daily.map((game, i)=><GameCard key={game.slug} game={game} score={done[game.slug]} active={i < 4} isNew={Boolean(game.newUntil && clock.dateKey <= game.newUntil && !done[game.slug])} />)}</div></section>
    <section className="hub-section" aria-labelledby="hub-practice"><h2 id="hub-practice" className="t-h2">Practice only</h2><p className="hub-lead">Fresh boards whenever you like. No leaderboard.</p>
      <div className="game-index">{practice.map((game)=><GameCard key={game.slug} game={game} active={false} practice />)}</div></section>
    <p className="hub-lead hub-teachers"><Link href="/about#teachers">Teaching geography? Countrivo works in class with no accounts</Link></p>
    <SiteFoot />
  </>;
}
