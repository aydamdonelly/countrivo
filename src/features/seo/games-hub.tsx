import { getAllGames } from '@/lib/data/games';
import { TABLE_GAMES } from '@/content/table';
import { GameCard } from '@/ui/game-card';
import { PageTitle } from "@/ui/page-title";
import { SiteFoot } from "@/ui/site-foot";
export function GamesHub() {
  const registry = getAllGames();
  const daily = TABLE_GAMES.filter((game)=>registry.find((g)=>g.slug===game.slug)?.availableModes.includes('daily'));
  const practice = TABLE_GAMES.filter((game)=>!daily.includes(game));
  return <><PageTitle title="Daily games" /><div className="game-index">{daily.map((game, i)=><GameCard key={game.slug} game={game} active={i === 0} />)}</div><h2 className="t-h2 mt-12">Practice</h2><div className="game-index">{practice.map((game)=><GameCard key={game.slug} game={game} active={false} practice />)}</div><SiteFoot /></>;
}
