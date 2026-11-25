import Link from "next/link";
import { getAllGames, getDailyGames } from "@/lib/data/games";
import { getCountryByIso3 } from "@/lib/data/countries";
import { getTodayDateKey } from "@/lib/daily-seed";
import { getArchivedBoard } from "@/server/board-snapshots";
import { isHoLStat, lineValue, statMeta } from "@/lib/game-logic/higher-or-lower/stats";
import { Flag } from "@/ui/flag";
import { boardDate } from "@/ui/result-format";
import "./yesterday-answers.css";

function record(value:unknown):value is Record<string,unknown> {
  return !!value&&typeof value==='object'&&!Array.isArray(value);
}
function rows(value:unknown):Record<string,unknown>[] {return Array.isArray(value)?value.filter(record):[];}
function names(value:unknown,key='name'):string[] {return rows(value).map(r=>typeof r[key]==='string'?r[key]:'').filter(Boolean);}

interface Answer {
  /** A single answer country, shown with its flag (GeoWordle). */
  country?: { iso2: string; name: string };
  /** What the list is: `Population`, `Best cabinet`. */
  label?: string;
  items: string[];
}

const EXPLORE: Answer = { items: [], label: 'Open the board to see every answer.' };

function statLine(stat: unknown, value: unknown): string | null {
  if (typeof stat !== 'string' || !isHoLStat(stat) || typeof value !== 'number') return null;
  return lineValue(stat, value);
}

function answerSummary(slug:string,solution:unknown):Answer {
  if(!record(solution))return EXPLORE;
  if(slug==='geo-wordle'&&typeof solution.answerIso3==='string'){
    const country=getCountryByIso3(solution.answerIso3);
    return country?{label:'The answer was',country:{iso2:country.iso2,name:country.displayName},items:[]}:{label:'The answer was',items:[solution.answerIso3]};
  }
  if(slug==='pinpoint')return {label:'Five places',items:names(solution.countries)};
  if(slug==='stat-guesser')return {items:rows(solution.rounds).flatMap(round=>{
    const country=record(round.country)?round.country.name:null;
    const value=statLine(round.stat,round.actualValue);
    const label=typeof round.stat==='string'&&isHoLStat(round.stat)?statMeta(round.stat).label:null;
    return typeof country==='string'&&value?[`${country}: ${label ? `${label} ` : ''}${value}`]:[];
  })};
  if(slug==='flag-quiz'&&solution.kind==='sprint')return {label:'The first flags',items:rows(solution.flags).slice(0,10).flatMap(flag=>typeof flag.iso3==='string'?[getCountryByIso3(flag.iso3)?.displayName??flag.iso3]:[])};
  if(record(solution.g)) {
    if(slug==='flag-quiz')return {label:'The flags',items:rows(solution.g.questions).flatMap(q=>record(q.country)&&typeof q.country.displayName==='string'?[q.country.displayName]:[])};
    if(slug==='higher-or-lower'){
      const stat=solution.g.stat;
      const label=typeof stat==='string'&&isHoLStat(stat)?statMeta(stat).label:undefined;
      return {label,items:rows(solution.g.chain).flatMap(c=>{const value=statLine(stat,c.value);return typeof c.name==='string'&&value?[`${c.name}: ${value}`]:[];})};
    }
  }
  if(slug==='country-draft'&&record(solution.board)) {
    const rounds=rows(solution.board.rounds);
    const cabinet=rows(solution.board.best).flatMap(pick=>{
      if(typeof pick.round!=='number'||typeof pick.countryIdx!=='number'||typeof pick.poolIdx!=='number')return[];
      const country=rows(rounds[pick.round]?.countries)[pick.countryIdx];
      const person=rows(country?.pool)[pick.poolIdx];
      return typeof person?.name==='string'?[person.name]:[];
    });
    if(cabinet.length)return {label:'Best cabinet',items:cabinet};
  }
  return EXPLORE;
}

/** Yesterday's closed boards, one row per game (25 November 2026: readable values, the GeoWordle
 *  answer with its flag, a 44 px Explore link). Rendered inside a "Yesterday's answers" disclosure. */
export async function YesterdayAnswers({dateKey=getTodayDateKey(),slug}:{dateKey?:string;slug?:string}) {
  const yesterday=new Date(`${dateKey}T12:00:00Z`);yesterday.setUTCDate(yesterday.getUTCDate()-1);
  const day=yesterday.toISOString().slice(0,10);
  const games=(slug?getAllGames():getDailyGames()).filter(g=>g.availableModes.includes('daily')&&(!slug||g.slug===slug));
  const boards=await Promise.all(games.map(async game=>({game,board:await getArchivedBoard(game.slug,day)})));
  const available=boards.filter(({board})=>board!==null);
  const date=boardDate(day).replace(/^\S+\s/,'');
  return <section className="home-yesterday" aria-label="Yesterday’s answers">
    {available.length?<><p className="yesterday-note">{date}. The boards have closed, so the answers are open.</p><ul className="yesterday-list">{available.map(({game,board})=>{const answer=answerSummary(game.slug,board?.solution);return <li className="yesterday-answer" key={game.slug} data-game={game.slug}>
      <div className="yesterday-head"><span className="yesterday-dot" aria-hidden="true" /><h3>{game.title}</h3><Link href={`/games/${game.slug}/play?mode=practice&date=${day}`} prefetch={false} aria-label={`Explore yesterday’s ${game.title} board`}>Explore</Link></div>
      {answer.label?<p className="yesterday-label">{answer.label}</p>:null}
      {answer.country?<p className="yesterday-country"><Flag iso2={answer.country.iso2} size="m" alt="" /><b>{answer.country.name}</b></p>:null}
      {answer.items.length?<p className="yesterday-items">{answer.items.join(' · ')}</p>:null}
    </li>;})}</ul></>:<p className="t-body text-mute">The new archive starts with today’s games. Come back tomorrow for their answers.</p>}
  </section>;
}
