import { cookies } from 'next/headers';
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
  return <><PageTitle title="Daily games" /><div className="game-index">{daily.map((game, i)=><GameCard key={game.slug} game={game} score={done[game.slug]} active={i === 0} />)}</div><h2 className="t-h2 mt-12">Practice</h2><div className="game-index">{practice.map((game)=><GameCard key={game.slug} game={game} active={false} practice />)}</div><SiteFoot /></>;
}
