import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllGames, getGameBySlug } from "@/lib/data/games";
import { getAllCountries } from "@/lib/data/countries";
import { getTodayDateKey } from "@/lib/daily-seed";
import { anonymousLeaderboard, deviceDailyRows, mapAnonymousRun } from "@/server/anonymous-runs";
import { getArchivedBoard } from "@/server/board-snapshots";
import { getEdition } from "@/server/edition";
import { getSimulatedRivals } from "@/server/leaderboard-bots";
import { LeaderboardEntryForm } from "@/features/play/leaderboard-entry";
import { Flag } from "@/ui/flag";
import { Button } from "@/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@/ui/icons";
import { ReportName } from "./report-name";
import "./leaderboard.css";

export interface LeaderboardPageProps { slug: string; date?: string; tab?: string }
export function shortDate(dateKey: string): string { return new Date(`${dateKey}T12:00:00Z`).toLocaleDateString("en-GB", {weekday:"short",day:"numeric",month:"short"}); }
export function shiftDateKey(dateKey: string, days: number): string { const d = new Date(`${dateKey}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10); }
const PAR: Record<string, string> = {"country-draft":"140 of 195","geo-wordle":"4 guesses",pinpoint:"720 of 1200","flag-quiz":"9 of 13","higher-or-lower":"9 of 13","stat-guesser":"300 of 600"};

export async function LeaderboardPage({ slug, date, tab }: LeaderboardPageProps) {
  const game = getGameBySlug(slug);
  if (!game || !game.availableModes.includes("daily")) notFound();
  const today = getTodayDateKey();
  const validDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(`${date}T12:00:00Z`));
  const day = validDate && date <= today ? date : today, yesterday=shiftDateKey(today,-1);
  const edition = await getEdition();
  const [rows,owned,practice,past]=await Promise.all([anonymousLeaderboard(slug,day,500),deviceDailyRows(day,edition),getSimulatedRivals(slug,day),day<today?getArchivedBoard(slug,day):null]);
  const mine=owned.find(r=>r.game_slug===slug),ownEntry=rows.find(r=>r.runId===mine?.id),top=rows.slice(0,50);
  const groups=new Map<string,{code:string;name:string;total:number;sort:number;count:number}>();
  for(const row of rows){if(!row.countryCode)continue;const old=groups.get(row.countryCode),country=getAllCountries().find(c=>c.iso2===row.countryCode);
    if(old){old.total+=row.scoreRaw;old.sort+=row.scoreSortValue;old.count+=1;}else groups.set(row.countryCode,{code:row.countryCode,name:country?.displayName??row.countryCode,total:row.scoreRaw,sort:row.scoreSortValue,count:1});}
  const countryRows=[...groups.values()].filter(g=>g.count>=10).sort((a,b)=>b.sort/b.count-a.sort/a.count);
  const countriesTab=tab==='countries'&&countryRows.length>0;
  const href=(dateKey:string,choice=tab)=>`/games/${slug}/leaderboard?date=${dateKey}${choice==='countries'?'&tab=countries':''}`;
  return <div className="new-leaderboard">
    <div className="lb-title">
      {/* eslint-disable-next-line @next/next/no-img-element -- local clay still */}
      <img src="/clay/cl-25/rest.webp" alt="" width={88} height={88}/><div><p className="t-kicker text-mute">Same board. Your name.</p><h1 className="t-h1">Leaderboard</h1></div>
    </div>
    <nav className="lb-games" aria-label="Pick a game's leaderboard">{getAllGames().filter(g=>g.availableModes.includes('daily')).map(g=><Link key={g.slug} href={`/games/${g.slug}/leaderboard?date=${day}`} aria-current={g.slug===slug?'page':undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element -- local clay game object */}
      <img src={`/clay/${g.slug}.png`} width={40} height={40} alt=""/><span>{g.title}</span></Link>)}</nav>
    <div className="lb-board">
      <nav className="lb-date" aria-label="Pick a day"><Link href={href(shiftDateKey(day,-1))} aria-label="Previous day"><ChevronLeftIcon size={20}/></Link><p><b className="t-h3">{game.title}</b><br/><span className="t-meta text-mute">{day===today?'Today':shortDate(day)} · {rows.length} {rows.length===1?'name':'names'}</span></p>{day<today?<Link href={href(shiftDateKey(day,1))} aria-label="Next day"><ChevronRightIcon size={20}/></Link>:<span aria-hidden="true"/>}</nav>
      <nav className="lb-period" aria-label="Recent boards"><Link href={href(today)} aria-current={day===today?'page':undefined}>Today</Link><Link href={href(yesterday)} aria-current={day===yesterday?'page':undefined}>Yesterday</Link>{past?<Link href={`/games/${slug}/play?mode=practice&date=${day}`}>Explore the answers</Link>:null}</nav>
      <nav className="lb-view-tabs" aria-label="Leaderboard view"><Link href={href(day,'names')} aria-current={!countriesTab?'page':undefined}>Names</Link>{countryRows.length>0?<Link href={href(day,'countries')} aria-current={countriesTab?'page':undefined}>Country averages</Link>:null}</nav>
      <div className="lb-par"><strong>Par</strong><div><b className="t-body">{PAR[slug]}</b><p className="t-meta text-mute">A fixed target to aim for every day.</p></div></div>
      {countriesTab?<><p className="t-meta text-mute">A country appears after at least 10 named players choose its flag. Each player’s score counts once.</p>{countryRows.length?<ol aria-label="Country averages">{countryRows.map((g,i)=><li className="lb-row" key={g.code}><span className="rank">{i+1}</span><div className="lb-person"><Flag iso2={g.code} size="s" alt=""/> <b>{g.name}</b><br/><span className="t-meta">{g.count} named players</span></div><span className="score">{(g.total/g.count).toLocaleString('en-US',{maximumFractionDigits:1})}</span></li>)}</ol>:<p className="lb-empty t-body">No country has 10 named players yet. Everyone’s individual score is visible in Names.</p>}</>:<>
        {top.length?<ol aria-label="Named player scores">{top.map(r=><li className={`lb-row${mine?.id===r.runId?' mine':''}`} key={r.runId}><span className="rank">{r.rankDaily}</span><div className="lb-person">{r.countryCode?<Flag iso2={r.countryCode} size="xs" alt=""/>:null} <b>{r.displayName}</b>{mine?.id===r.runId?<span className="t-meta">You</span>:null}<br/><ReportName runId={r.runId} name={r.displayName}/></div><span className="score">{r.scoreDisplay}</span></li>)}</ol>:<div className="lb-empty"><p className="t-body">{day===today?'Your name could be first today.':'No names were published on this board.'}</p>{day===today?<Button href={`/games/${slug}/play?mode=daily`}>Play {game.title}</Button>:null}</div>}
        {ownEntry&&!top.some(r=>r.runId===ownEntry.runId)?<div className="lb-row mine" aria-label="Your place outside the top 50"><span className="rank">{ownEntry.rankDaily}</span><b>{ownEntry.displayName} · You</b><span className="score">{ownEntry.scoreDisplay}</span></div>:null}
        {day===today&&mine&&mine.display_name?<div className="lb-own"><LeaderboardEntryForm run={await mapAnonymousRun(mine)} publishedName={mine.display_name}/></div>:null}
      </>}
      <p className="t-meta text-mute mt-4">{day===today?'Play first. Add your name after the result.':'This board is closed. Published scores are read-only.'}</p>
      {practice.length?<details className="lb-demo" open><summary>Practice rivals <span className="t-meta text-mute">Simulated bots</span></summary><p className="t-meta text-mute mb-3">These are computer opponents for comparison. They aren’t counted as players or included in your rank.</p><ol aria-label="Simulated practice opponents">{practice.map((r,i)=><li className="lb-row" key={r.name}><span className="rank">{i+1}</span><div className="lb-person">{r.name}<span className="t-meta">Bot</span></div><span className="score">{r.score}</span></li>)}</ol></details>:null}
    </div>
  </div>;
}
