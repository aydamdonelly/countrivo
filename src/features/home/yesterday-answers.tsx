import Link from "next/link";
import { getAllGames } from "@/lib/data/games";
import { getCountryByIso3 } from "@/lib/data/countries";
import { getTodayDateKey } from "@/lib/daily-seed";
import { getArchivedBoard } from "@/server/board-snapshots";

function record(value:unknown):value is Record<string,unknown> {
  return !!value&&typeof value==='object'&&!Array.isArray(value);
}
function rows(value:unknown):Record<string,unknown>[] {return Array.isArray(value)?value.filter(record):[];}
function names(value:unknown,key='name'):string[] {return rows(value).map(r=>typeof r[key]==='string'?r[key]:'').filter(Boolean);}

function answerSummary(slug:string,solution:unknown):string {
  if(!record(solution))return 'The board and its answers are ready to explore.';
  if(slug==='geo-wordle'&&typeof solution.answerIso3==='string')return getCountryByIso3(solution.answerIso3)?.displayName??solution.answerIso3;
  if(slug==='pinpoint')return names(solution.countries).join(' · ');
  if(slug==='stat-guesser')return rows(solution.rounds).map(round=>{
    const country=record(round.country)?round.country.name:null;
    return typeof country==='string'&&typeof round.actualValue==='number'?`${country}: ${round.actualValue.toLocaleString('en-US')}`:'';
  }).filter(Boolean).join(' · ');
  if(record(solution.g)) {
    if(slug==='flag-quiz')return rows(solution.g.questions).flatMap(q=>record(q.country)&&typeof q.country.displayName==='string'?[q.country.displayName]:[]).join(' · ');
    if(slug==='higher-or-lower')return rows(solution.g.chain).map(c=>typeof c.name==='string'&&typeof c.value==='number'?`${c.name}: ${c.value.toLocaleString('en-US')}`:'').filter(Boolean).join(' · ');
  }
  if(slug==='country-draft'&&record(solution.board)) {
    const rounds=rows(solution.board.rounds);
    const cabinet=rows(solution.board.best).flatMap(pick=>{
      if(typeof pick.round!=='number'||typeof pick.countryIdx!=='number'||typeof pick.poolIdx!=='number')return[];
      const country=rows(rounds[pick.round]?.countries)[pick.countryIdx];
      const person=rows(country?.pool)[pick.poolIdx];
      return typeof person?.name==='string'?[person.name]:[];
    });
    if(cabinet.length)return `Best cabinet: ${cabinet.join(' · ')}`;
  }
  return 'The board and its answers are ready to explore.';
}

export async function YesterdayAnswers({dateKey=getTodayDateKey(),slug}:{dateKey?:string;slug?:string}) {
  const yesterday=new Date(`${dateKey}T12:00:00Z`);yesterday.setUTCDate(yesterday.getUTCDate()-1);
  const day=yesterday.toISOString().slice(0,10);
  const games=getAllGames().filter(g=>g.availableModes.includes('daily')&&(!slug||g.slug===slug));
  const boards=await Promise.all(games.map(async game=>({game,board:await getArchivedBoard(game.slug,day)})));
  const available=boards.filter(({board})=>board!==null);
  return <section className="home-yesterday" aria-labelledby="yesterday-title">
    <h2 className="t-h2" id="yesterday-title">Yesterday’s answers</h2>
    {available.length?<><p className="t-meta text-mute">{day} · The daily boards have closed, so the answers are open.</p><div className="yesterday-answers-grid">{available.map(({game,board})=><article className="yesterday-answer" key={game.slug}>
      <h3 className="t-h3">{game.title}</h3><p className="t-body">{answerSummary(game.slug,board?.solution)}</p><Link className="t-meta" href={`/games/${game.slug}/play?mode=practice&date=${day}`}>Explore this board</Link>
    </article>)}</div></>:<p className="t-body text-mute">The new archive starts with today’s games. Come back tomorrow for their answers.</p>}
  </section>;
}
