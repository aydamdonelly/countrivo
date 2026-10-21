import { NavigationLink as Link } from "@/ui/navigation-link";
import { notFound } from "next/navigation";
import { getAllGames, getGameBySlug } from "@/lib/data/games";
import { getCountryByIso3 } from "@/lib/data/countries";
import { getTodayDateKey } from "@/lib/daily-seed";
import { anonymousBoard, blockedLeaderboardRuns, deviceDailyRows, mapAnonymousRun } from "@/server/anonymous-runs";
import { getArchivedBoard } from "@/server/board-snapshots";
import { getEdition } from "@/server/edition";
import { getSimulatedRivals } from "@/server/leaderboard-bots";
import { LeaderboardEntryForm } from "@/features/play/leaderboard-entry";
import { Flag } from "@/ui/flag";
import { Button } from "@/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@/ui/icons";
import { BlockedPlayersSettings, LeaderboardRetry, ReportName } from "./report-name";
import "./leaderboard.css";

export interface LeaderboardPageProps { slug: string; date?: string; tab?: string }
export function shortDate(dateKey: string): string { return new Date(`${dateKey}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }); }
export function shiftDateKey(dateKey: string, days: number): string { const day = new Date(`${dateKey}T12:00:00Z`); day.setUTCDate(day.getUTCDate() + days); return day.toISOString().slice(0, 10); }
const PAR: Record<string, { label: string; score: number }> = {
  "country-draft": { label: "140 / 195", score: 140 }, "geo-wordle": { label: "4 guesses", score: 4 },
  pinpoint: { label: "720 / 1,200", score: 720 }, "flag-quiz": { label: "9 / 13", score: 9 },
  "higher-or-lower": { label: "9 / 13", score: 9 }, "stat-guesser": { label: "300 / 600", score: 300 },
};

export async function LeaderboardPage({ slug, date, tab }: LeaderboardPageProps) {
  const game = getGameBySlug(slug);
  if (!game || !game.availableModes.includes("daily")) notFound();
  const today = getTodayDateKey();
  const validDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(`${date}T12:00:00Z`))
    && new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date;
  const day = validDate && date <= today ? date : today;
  const past = day < today ? await getArchivedBoard(slug, day) : null;
  const edition = day === today ? await getEdition() : past?.edition ?? "";
  const [board, owned, practice, blocked] = await Promise.all([
    anonymousBoard(slug, day, { edition }), deviceDailyRows(day, edition), getSimulatedRivals(slug, day), blockedLeaderboardRuns(slug, day, edition),
  ]);
  const mine = owned.find(row => row.game_slug === slug);
  const ownRun = mine ? await mapAnonymousRun(mine) : null;
  const showOwn = day === today && !!mine && !!ownRun;
  const top = board.entries.slice(0, 50).filter(row => !blocked.ids.includes(row.runId) && !(showOwn && row.runId === mine?.id));
  const countriesTab = tab === "countries";
  const target = PAR[slug];
  const href = (dateKey: string, choice = tab) => `/games/${slug}/leaderboard?date=${dateKey}${choice === "countries" ? "&tab=countries" : ""}`;
  const privatePreview = showOwn && !mine?.display_name && !!ownRun?.rankPreview;
  const hasNamedMine = mine?.display_name && !mine.moderation_hidden;

  return <div className="new-leaderboard">
    <div className="lb-title">
      {/* eslint-disable-next-line @next/next/no-img-element -- local clay still */}
      <img src={`/clay/${slug}.png`} alt="" width={56} height={56} /><div><p className="t-meta text-mute">Leaderboard</p><h1 className="t-h1">{game.title}</h1></div>
    </div>
    <details className="lb-game-picker"><summary className="t-meta">Change game</summary><nav className="lb-games" aria-label="Pick a game's leaderboard">{getAllGames().filter(item => item.availableModes.includes("daily")).map(item => <Link key={item.slug} href={`/games/${item.slug}/leaderboard?date=${day}`} aria-current={item.slug === slug ? "page" : undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element -- local clay game object */}
      <img src={`/clay/${item.slug}.png`} width={40} height={40} alt="" /><span>{item.title}</span></Link>)}</nav></details>
    <div className="lb-board">
      <nav className="lb-date" aria-label="Pick a day"><Link href={href(shiftDateKey(day, -1))} aria-label="Previous day" pendingLabel={<><span aria-hidden="true">…</span><span className="sr-only">Opening…</span></>}><ChevronLeftIcon size={20} /></Link>
        <div><h2 className="t-h3">{day === today ? "Today" : shortDate(day)}</h2><p className="t-meta text-mute">{board.available ? `${board.playerCount.toLocaleString("en-US")} published ${board.playerCount === 1 ? "player" : "players"}` : "Daily board"}</p></div>
        {day < today ? <Link href={href(shiftDateKey(day, 1))} aria-label="Next day" pendingLabel={<><span aria-hidden="true">…</span><span className="sr-only">Opening…</span></>}><ChevronRightIcon size={20} /></Link> : <span aria-hidden="true" />}
      </nav>
      <nav className="lb-period" aria-label="Recent boards"><Link href={href(today)} aria-current={day === today ? "page" : undefined}>Today</Link><Link href={href(shiftDateKey(today, -1))} aria-current={day === shiftDateKey(today, -1) ? "page" : undefined}>Yesterday</Link>{past ? <Link href={`/games/${slug}/play?mode=practice&date=${day}`}>Play this board</Link> : null}</nav>
      {day === today && !mine ? <div className="lb-play-prompt"><p className="t-body">Play today to add your score.</p><Button href={`/games/${slug}/play?mode=daily`}>Play {game.title}</Button></div> : null}
      <nav className="lb-view-tabs" aria-label="Leaderboard view"><Link href={href(day, "names")} aria-current={!countriesTab ? "page" : undefined}>Players</Link><Link href={href(day, "countries")} aria-current={countriesTab ? "page" : undefined}>Countries</Link></nav>
      {!board.available ? <div className="lb-empty"><p className="t-body">The board couldn’t be opened. Your saved result is safe.</p><LeaderboardRetry /></div> : countriesTab ? <>
        <p className="t-meta text-mute lb-caption">Average score · 10 published players needed per country</p>
        {board.countries.length ? <ol aria-label="Country averages">{board.countries.map(country => {
          const info = getCountryByIso3(country.code);
          return <li className="lb-row lb-country-row" key={country.code}><span className="rank">{country.rank}</span><div className="lb-person"><div className="lb-player-name">{info ? <Flag iso2={info.iso2} size="s" alt="" /> : null}<b>{info?.displayName ?? country.code}</b></div><span className="t-meta text-mute">{country.count} players</span></div><span className="score">{Number(country.average).toLocaleString("en-US", { maximumFractionDigits: 1 })}<small>{slug === "geo-wordle" ? "guesses" : "points"}</small></span></li>;
        })}</ol> : <div className="lb-empty"><p className="t-body">No country has 10 published players yet.</p><p className="t-meta text-mute">Add your flag when you publish a result.</p></div>}
      </> : <>
        {privatePreview ? <p className="t-meta text-mute lb-caption">Preview includes your private score. Join to publish.</p> : null}
        <div className="lb-column-head t-meta text-mute"><span>Place</span><span>Player</span><span>Score</span><span className="sr-only">Player options</span></div>
        {top.length || showOwn ? <ol aria-label="Published player scores">{(() => {
          const own = showOwn && ownRun ? <li key="own-score" className="lb-result-entry" id="leaderboard-your-score"><LeaderboardEntryForm run={ownRun} publishedName={mine?.display_name} onBoard /></li> : null;
          let inserted = false;
          const rows = top.flatMap(row => {
            const shownRank = row.rankDaily + (privatePreview && ownRun && row.scoreSortValue < ownRun.scoreSortValue ? 1 : 0);
            const insert = own && !inserted && ownRun && row.scoreSortValue <= ownRun.scoreSortValue;
            if (insert) inserted = true;
            const item = <li className={`lb-row${mine?.id === row.runId ? " mine" : ""}${shownRank === 1 ? " first" : ""}`} key={row.runId} id={!showOwn && mine?.id === row.runId ? "leaderboard-your-score" : undefined} aria-label={`${row.displayName}, place ${shownRank}, ${row.scoreDisplay}${mine?.id === row.runId ? ", you" : ""}`}>
              <span className="rank">{shownRank}</span><div className="lb-person"><div className="lb-player-name">{row.countryCode ? <Flag iso2={row.countryCode} size="xs" alt="" /> : null}<b>{row.displayName}</b>{mine?.id === row.runId ? <span className="lb-you">You</span> : null}</div></div><span className="score">{row.scoreDisplay}</span>{mine?.id !== row.runId ? <ReportName runId={row.runId} name={row.displayName} /> : <span aria-hidden="true" />}
            </li>;
            return insert ? [own, item] : [item];
          });
          if (own && !inserted) {
            if (board.playerCount > 50) rows.push(<li key="gap" className="lb-gap t-meta">Other places omitted</li>);
            rows.push(own);
          }
          return rows;
        })()}</ol> : <div className="lb-empty"><p className="t-body">{blocked.ids.length ? "These players are hidden on your browser." : day === today ? "Set the first score today." : "No scores were published on this board."}</p></div>}
        {day !== today && hasNamedMine && ownRun?.rankDaily && !top.some(row => row.runId === mine.id) ? <><p className="lb-gap t-meta">Your place</p><div className="lb-row mine lb-country-row" id="leaderboard-your-score"><span className="rank">{ownRun.rankDaily}</span><div className="lb-player-name"><b>{mine.display_name}</b><span className="lb-you">You</span></div><span className="score">{ownRun.scoreDisplay}</span></div></> : null}
        {board.playerCount > 50 ? <p className="t-meta text-mute lb-caption">Top 50 of {board.playerCount.toLocaleString("en-US")} published players. Equal scores share a place.</p> : null}
      </>}
      {blocked.enabled ? <BlockedPlayersSettings /> : null}
      <p className="t-meta text-mute lb-caption">{slug === "geo-wordle" ? "Fewer guesses wins." : "More points wins."} Equal scores share a place.{day < today ? " This board is closed." : ""}</p>
      <p className="t-meta text-mute lb-target">Daily target <b className="num">{target.label}</b><span>Par</span></p>
      {practice.length ? <details className="lb-demo"><summary>Practice rivals <span className="t-meta text-mute">Simulated bots</span></summary><p className="t-meta text-mute mb-3">Computer opponents. Excluded from player counts and ranks.</p><ol aria-label="Simulated practice opponents">{practice.map((rival, index) => <li className="lb-row lb-country-row" key={rival.name}><span className="rank">{index + 1}</span><div className="lb-player-name">{rival.name}<span className="lb-you">Bot</span></div><span className="score">{rival.score}</span></li>)}</ol></details> : null}
    </div>
  </div>;
}
