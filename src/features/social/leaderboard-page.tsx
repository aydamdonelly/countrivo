import Link from "next/link";
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
  const top = board.entries.slice(0, 50).filter(row => !blocked.ids.includes(row.runId));
  const countriesTab = tab === "countries";
  const target = PAR[slug];
  const beatPar = ownRun && (slug === "geo-wordle" ? ownRun.scoreRaw <= target.score : ownRun.scoreRaw >= target.score);
  const href = (dateKey: string, choice = tab) => `/games/${slug}/leaderboard?date=${dateKey}${choice === "countries" ? "&tab=countries" : ""}`;
  const hasNamedMine = mine?.display_name && !mine.moderation_hidden;

  return <div className="new-leaderboard">
    <div className="lb-title">
      {/* eslint-disable-next-line @next/next/no-img-element -- local clay still */}
      <img src="/clay/cl-25/rest.webp" alt="" width={88} height={88} /><div><p className="t-kicker text-mute">One board. Equal scores share a place.</p><h1 className="t-h1">Leaderboard</h1></div>
    </div>
    <nav className="lb-games" aria-label="Pick a game's leaderboard">{getAllGames().filter(item => item.availableModes.includes("daily")).map(item => <Link key={item.slug} href={`/games/${item.slug}/leaderboard?date=${day}`} aria-current={item.slug === slug ? "page" : undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element -- local clay game object */}
      <img src={`/clay/${item.slug}.png`} width={40} height={40} alt="" /><span>{item.title}</span></Link>)}</nav>
    <div className="lb-board">
      <nav className="lb-date" aria-label="Pick a day"><Link href={href(shiftDateKey(day, -1))} aria-label="Previous day"><ChevronLeftIcon size={20} /></Link>
        <div><h2 className="t-h2">{game.title}</h2><p className="t-meta text-mute">{day === today ? "Today" : shortDate(day)}{board.available ? ` · ${board.playerCount.toLocaleString("en-US")} ${board.playerCount === 1 ? "player" : "players"}` : ""}</p></div>
        {day < today ? <Link href={href(shiftDateKey(day, 1))} aria-label="Next day"><ChevronRightIcon size={20} /></Link> : <span aria-hidden="true" />}
      </nav>
      <nav className="lb-period" aria-label="Recent boards"><Link href={href(today)} aria-current={day === today ? "page" : undefined}>Today</Link><Link href={href(shiftDateKey(today, -1))} aria-current={day === shiftDateKey(today, -1) ? "page" : undefined}>Yesterday</Link>{past ? <Link href={`/games/${slug}/play?mode=practice&date=${day}`}>Play this board</Link> : null}</nav>
      <div className={`lb-benchmarks${ownRun ? " has-result" : ""}`}>
        {ownRun ? <div className="lb-your-place"><span className="t-meta">{hasNamedMine && ownRun.rankDaily ? "Your place" : "Your result"}</span>
          <strong>{hasNamedMine && ownRun.rankDaily ? `#${ownRun.rankDaily}` : ownRun.scoreDisplay}</strong>
          <span className="t-meta">{hasNamedMine && ownRun.rankDaily ? ownRun.scoreDisplay : mine?.moderation_hidden ? "Name under review" : "Saved privately"}</span>
        </div> : null}
        <div className="lb-par"><span className="t-meta">Daily target</span><strong>{target.label}</strong><span className="t-meta">{ownRun ? beatPar ? "You reached par" : "Par" : "Par"}</span></div>
      </div>
      {day === today && mine && ownRun ? <div className="lb-own"><LeaderboardEntryForm run={ownRun} publishedName={mine.display_name} /></div> : null}
      <nav className="lb-view-tabs" aria-label="Leaderboard view"><Link href={href(day, "names")} aria-current={!countriesTab ? "page" : undefined}>Players</Link><Link href={href(day, "countries")} aria-current={countriesTab ? "page" : undefined}>Countries</Link></nav>
      {!board.available ? <div className="lb-empty"><p className="t-body">The board couldn’t be opened. Your saved result is safe.</p><LeaderboardRetry /></div> : countriesTab ? <>
        <p className="t-meta text-mute lb-caption">Average score · 10 published players needed per country</p>
        {board.countries.length ? <ol aria-label="Country averages">{board.countries.map(country => {
          const info = getCountryByIso3(country.code);
          return <li className="lb-row" key={country.code}><span className="rank">{country.rank}</span><div className="lb-person"><div className="lb-player-name">{info ? <Flag iso2={info.iso2} size="s" alt="" /> : null}<b>{info?.displayName ?? country.code}</b></div><span className="t-meta text-mute">{country.count} players</span></div><span className="score">{Number(country.average).toLocaleString("en-US", { maximumFractionDigits: 1 })}<small>{slug === "geo-wordle" ? "guesses" : "points"}</small></span></li>;
        })}</ol> : <div className="lb-empty"><p className="t-body">No country has 10 published players yet.</p><p className="t-meta text-mute">Add your flag when you publish a result.</p></div>}
      </> : <>
        <div className="lb-column-head t-meta text-mute"><span>Place</span><span>Player</span><span>{slug === "geo-wordle" ? "Fewer guesses wins" : "More points wins"}</span></div>
        {top.length ? <ol aria-label="Published player scores">{top.map(row => <li className={`lb-row${mine?.id === row.runId ? " mine" : ""}${row.rankDaily === 1 ? " first" : ""}`} key={row.runId} aria-label={`${row.displayName}, place ${row.rankDaily}, ${row.scoreDisplay}${mine?.id === row.runId ? ", you" : ""}`}>
          <span className="rank">{row.rankDaily}</span><div className="lb-person"><div className="lb-player-name">{row.countryCode ? <Flag iso2={row.countryCode} size="xs" alt="" /> : null}<b>{row.displayName}</b>{mine?.id === row.runId ? <span className="lb-you">You</span> : null}</div>
            {mine?.id !== row.runId ? <ReportName runId={row.runId} name={row.displayName} /> : null}</div><span className="score">{row.scoreDisplay}</span>
        </li>)}</ol> : <div className="lb-empty"><p className="t-body">{blocked.ids.length ? "These players are hidden on your browser." : day === today ? "Set the first score today." : "No scores were published on this board."}</p>{day === today && !mine ? <Button href={`/games/${slug}/play?mode=daily`}>Play {game.title}</Button> : null}</div>}
        {hasNamedMine && ownRun?.rankDaily && !top.some(row => row.runId === mine.id) ? <><p className="lb-gap t-meta text-mute">Your place</p><div className="lb-row mine"><span className="rank">{ownRun.rankDaily}</span><div className="lb-player-name"><b>{mine.display_name}</b><span className="lb-you">You</span></div><span className="score">{ownRun.scoreDisplay}</span></div></> : null}
        {board.playerCount > 50 ? <p className="t-meta text-mute lb-caption">Top 50 of {board.playerCount.toLocaleString("en-US")} published players. Equal scores share a place.</p> : null}
      </>}
      {blocked.enabled ? <BlockedPlayersSettings /> : null}
      <p className="t-meta text-mute mt-4">{day === today ? "Play first. Add your name after your result." : "This board is closed."}</p>
      {practice.length ? <details className="lb-demo"><summary>Practice rivals <span className="t-meta text-mute">Simulated bots</span></summary><p className="t-meta text-mute mb-3">Computer opponents. Excluded from player counts and ranks.</p><ol aria-label="Simulated practice opponents">{practice.map((rival, index) => <li className="lb-row" key={rival.name}><span className="rank">{index + 1}</span><div className="lb-player-name">{rival.name}<span className="lb-you">Bot</span></div><span className="score">{rival.score}</span></li>)}</ol></details> : null}
    </div>
  </div>;
}
