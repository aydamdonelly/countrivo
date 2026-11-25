import { TABLE_GAMES, gamePresentation } from "@/content/table";
import { Clay } from "@/ui/clay";
import type { ReactNode } from "react";
import type { ServerGameRun } from "@/types/server";
import { NavigationLink as Link } from "@/ui/navigation-link";
import { cn } from "@/lib/utils";
import { Countdown } from "@/ui/countdown";
import { CountUp } from "@/ui/count-up";
import { DailyNext, type DailyNextProps } from "@/ui/daily-next";
import { ShareButton } from "@/ui/share-button";
import { boardDate, ordinal } from "@/ui/result-format";
import "./result-panel.css";

export type ResultMode = "daily" | "practice" | "lockout" | "shared";

export interface ResultRanks {
  globalRank: number | null;
  globalShots: number;
  friendRank: number | null;
  friendCount: number;
  /** Practice: the personal best. */
  best?: string | null;
}

/** Your place today, published or as a private preview. */
export interface ResultRank {
  rank: number;
  of: number;
}

/** The one share action of a result screen. */
export interface ResultShare {
  text: string;
  challengeUrl?: string;
  onShare?: () => void;
  /** Country Draft: "Challenge a friend" when a challenge link exists. Default "Share result". */
  label?: string;
}

/** One cell of the facts row: `9 / Daily target`. */
export interface ResultFact {
  value: string;
  label: string;
}

export interface ResultPanelProps {
  mode: ResultMode;
  /** The game title, for the kicker. */
  game: string;
  /** The game slug, for the clay plate and the links; derived from `game` when left out. */
  slug?: string;
  /** The compact score: `612`, `4/6`, `1 280 pts`, `7 in a row`. */
  score: string;
  /** A verdict that adds meaning, such as `Not this time`. No generic `Round complete`. */
  outcome?: string;
  /** Overrides the kicker (`shared`: `Country Draft · Sat 28 Aug`). */
  kicker?: string;
  /** The board date, for the kicker `Higher or Lower · Wednesday 25 November`. */
  dateKey?: string;
  counter?: string;
  ranks?: ResultRanks;
  /** Today's place; use `runRank(run)`. */
  rank?: ResultRank | null;
  personalBest?: boolean;
  /** A save failure in words (blueprint 10.8). */
  failReason?: string | null;
  practiceHref?: string;
  /** Lockout: the `New boards in` line. */
  clock?: { resetAt: number; serverNow: number };
  /** Practice, lockout and shared pages: the view's action (One more, New board). */
  actions?: ReactNode;
  /** Daily only: today's progress and the next game, or the day-complete card. */
  daily?: DailyNextProps;
  /** The single share of the screen; hidden while the day-complete card owns the share. */
  share?: ResultShare;
  /** The leaderboard and name entry: right column on desktop. */
  primaryAction?: ReactNode;
  feedback?: ReactNode;
  /** A slot inside the card under the verdict (GeoWordle: the answer, its flag and its map). */
  answer?: ReactNode;
  /** The solution review, open, between the next game and the leaderboard: every round's answer. */
  review?: ReactNode;
  /** Overrides the clay on the plate. */
  clay?: { object: string; state?: string };
  /** Counts the leading number of `score` from 0 over 600 ms once (blueprint 6.3.6); the HTML holds the final value. */
  animateScore?: boolean;
  /** The game's details: Answers, Your route, Your week. */
  children?: ReactNode;
  className?: string;
}

/** The save-failure reasons in words (blueprint 10.8). */
export function failReasonText(code: string): string {
  if (code === "too_fast") return "played too fast";
  if (code === "already_played") return "already played today";
  if (code.startsWith("server_validation_failed")) return "the server rejected the replay";
  if (code === "invalid_start_time") return "the clock did not agree";
  if (code === "board_closed") return "this daily board closed at midnight";
  if (code === "save_unavailable") return "connection interrupted; your result is still here";
  return "something went wrong";
}

/** Today's place from a saved run: published rank, else the private preview. */
export function runRank(run: ServerGameRun | null | undefined): ResultRank | null {
  if (!run || run.moderationHidden || run.mode !== "daily") return null;
  if (run.rankDaily) return { rank: run.rankDaily, of: Math.max(run.rankDaily, run.dailyNameCount ?? 0, run.leaderboard?.playerCount ?? 0) };
  if (run.rankPreview) return { rank: run.rankPreview.rank, of: Math.max(run.rankPreview.rank, run.rankPreview.playerCount) };
  return null;
}

/** Splits `1 280 pts` into its leading number and the rest, or null when the score does not start with one. */
function splitScore(score: string): { n: number; digits: string; rest: string } | null {
  const m = score.match(/^[+]?(\d[\d ,]*)(.*)$/);
  if (!m) return null;
  const digits = m[1].replace(/[ ,]+$/, "");
  const n = Number(digits.replace(/[ ,]/g, ""));
  if (!Number.isFinite(n)) return null;
  return { n, digits, rest: m[2].trim() };
}

export interface ResultCardProps {
  slug?: string;
  kicker: string;
  verdict?: string;
  /** The big number (may be animated); the maximum as `/13`; the unit line (`points`). */
  value: ReactNode;
  max?: string;
  unit?: string;
  facts: ResultFact[];
  /** One line under the facts, such as `New personal best`. */
  note?: string;
  clay: { object: string; state?: string; tone?: "original" | "color" };
  answer?: ReactNode;
  share?: ResultShare;
  /** The day-complete state: plate, kicker, score and one summary line in a row. */
  compact?: { kicker: string; line: string };
  animate?: boolean;
  label: string;
  srScore: string;
}

/** The result card: clay plate, kicker, verdict, score, facts and the single share. */
export function ResultCard({ slug, kicker, verdict, value, max, unit, facts, note, clay, answer, share, compact, animate, label, srScore }: ResultCardProps) {
  const plate = <span className="rc-plate" data-game={slug} aria-hidden="true"><Clay object={clay.object} state={clay.state} tone={clay.tone ?? "color"} className="result-clay" sizes="64px" loading="eager" /></span>;
  if (compact) {
    return <section className={cn("rp a-card rc compact", animate && "rp-arrived")} aria-label={label}>
      {plate}
      <div className="rc-compact-copy">
        <p className="rc-kicker">{compact.kicker}</p>
        <p className="score num"><span className="sr-only">{srScore}</span><span className="rp-score-content" aria-hidden="true"><b>{value}</b>{max ? <span className="score-fraction">{max}</span> : null}</span></p>
        <p className="rc-line">{compact.line}</p>
      </div>
    </section>;
  }
  return <section className={cn("rp a-card rc", animate && "rp-arrived")} aria-label={label}>
    {plate}
    <p className="rc-kicker">{kicker}</p>
    {verdict ? <h2 className="rp-outcome">{verdict}</h2> : null}
    {answer ? <div className="rc-answer">{answer}</div> : null}
    <p className="score num">
      <span className="sr-only">{srScore}</span>
      <span className="rp-score-content" aria-hidden="true"><b className="t-score-xl">{value}</b>{max ? <span className="score-fraction">{max}</span> : null}</span>
    </p>
    {unit ? <p className="rp-score-label">{unit}</p> : null}
    {facts.length ? <dl className="rc-facts" style={{ gridTemplateColumns: `repeat(${facts.length}, minmax(0, 1fr))` }}>{facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd className="num">{fact.value}</dd></div>)}</dl> : null}
    {note ? <p className="pb-line">{note}</p> : null}
    {share ? <div className="rc-foot"><ShareButton block text={share.text} challengeUrl={share.challengeUrl} onShare={share.onShare} label={share.label ?? "Share result"} source="result" /></div> : null}
  </section>;
}

const LOWER_IS_BETTER = new Set(["GeoWordle", "Blind Pick"]);

/** Target and difference cells: `9 / Daily target`, `+2 / Above target`. */
export function targetFacts(game: string, value: number | undefined, par: number | undefined): ResultFact[] {
  if (par === undefined) return [];
  const facts: ResultFact[] = [{ value: `${game === "Blind Pick" ? "+" : ""}${par}`, label: "Daily target" }];
  if (value === undefined) return facts;
  const lower = LOWER_IS_BETTER.has(game);
  const delta = lower ? par - value : value - par;
  if (delta === 0) facts.push({ value: "0", label: "On target" });
  else if (lower) facts.push({ value: String(Math.abs(delta)), label: delta > 0 ? "Under target" : "Over target" });
  else facts.push({ value: delta > 0 ? `+${delta}` : String(Math.abs(delta)), label: delta > 0 ? "Above target" : "Below target" });
  return facts;
}

/**
 * The finished-game screen (25 November 2026 design pass). One DOM order for every size:
 * 1 result card, 2 leaderboard and name (moved up on 25 November 2026 so a phone sees it first),
 * 3 primary block (next game or day complete), 4 the answers (`review`), 5 details,
 * 6 tertiary links, 7 feedback line. At 1024 and wider the leaderboard moves to
 * a 440 px right column. Exactly one share per screen: the card's secondary "Share result",
 * or the day-complete card's primary "Share your day".
 */
export function ResultPanel({ mode, game, slug: slugProp, score, outcome, kicker, dateKey, counter, ranks, rank, personalBest, failReason, practiceHref, clock, actions, daily, share, primaryAction, feedback, answer, review, clay: clayProp, children, animateScore, className }: ResultPanelProps) {
  const presentation = slugProp ? gamePresentation(slugProp) : TABLE_GAMES.find((item) => item.title === game);
  const slug = slugProp ?? presentation?.slug;
  const parts = splitScore(score);
  const rest = parts?.rest ?? "";
  const fraction = /^(?:\/|of\b)/i.test(rest) ? `/${rest.replace(/^(?:\/|of)\s*/i, "")}` : undefined;
  // A Flag Quiz score in flags is the twenty-second sprint; `9 of 13` is a ten-flag board.
  const flagSprint = game === "Flag Quiz" && /^flags?$/.test(rest);
  const parByGame: Record<string, number> = { "Country Draft": 140, GeoWordle: 4, Pinpoint: 720, "Flag Quiz": flagSprint ? 8 : 9, "Higher or Lower": 9, "Stat Guesser": 300, "Blind Pick": 10 };
  const par = mode === "practice" && game === "Higher or Lower" ? undefined : parByGame[game];
  const unitByGame: Record<string, string> = { "Flag Quiz": "points", "Higher or Lower": mode === "practice" ? "correct calls" : "points", "Stat Guesser": "points", Pinpoint: "points", "Country Draft": "points", GeoWordle: "guesses", "Blind Pick": "rank places over the best fit", "Capital Quiz": "capitals" };
  // A GeoWordle loss (`X/6`) has no number to measure against the target.
  const lost = game === "GeoWordle" && !parts;
  const unit = lost ? "not found in 6 guesses" : !parts ? undefined : fraction || !rest ? unitByGame[game] : rest;
  const finalRank = rank ?? (ranks?.globalRank ? { rank: ranks.globalRank, of: Math.max(ranks.globalRank, ranks.globalShots) } : null);
  const facts: ResultFact[] = lost ? [] : [...targetFacts(game, parts?.n, par)];
  if (mode === "practice" && ranks?.best) facts.push({ value: ranks.best, label: "Your best" });
  else if (finalRank && mode !== "practice") facts.push({ value: ordinal(finalRank.rank), label: `of ${finalRank.of} today` });
  const dayComplete = !!daily && !daily.next && !!daily.dayShare;
  const k = kicker ?? (mode === "practice" ? `Practice · ${game}` : dateKey ? `${game} · ${boardDate(dateKey)}` : game);
  const kickerLine = counter && !/^par\b/i.test(counter) ? `${k} · ${counter}` : k;
  const plate = clayProp ?? (presentation ? { object: presentation.clay, state: lost ? "tilt" : presentation.done } : { object: "cl-20" });
  const value = parts ? <>{score.startsWith("+") ? "+" : ""}{animateScore ? <CountUp value={parts.n} duration={600} kind={/[ ,]/.test(parts.digits) ? "grouped" : "int"} /> : parts.digits}</> : score;
  const compactLine = [par !== undefined ? `Target ${game === "Blind Pick" ? "+" : ""}${par}` : null, finalRank ? `${ordinal(finalRank.rank)} of ${finalRank.of} today` : null].filter(Boolean).join(" · ");
  const links = (mode === "daily" || mode === "lockout") && slug ? <nav className="a-links" aria-label="More for this game">
    <Link className="btn btn-tertiary" href={practiceHref ?? `/games/${slug}/play?mode=practice`}>Practice {game}</Link>
    <Link className="btn btn-tertiary" prefetch pendingLabel="Opening leaderboard" href={`/games/${slug}/leaderboard${dateKey ? `?date=${dateKey}` : ""}#leaderboard-your-score`}>Full leaderboard</Link>
  </nav> : null;
  return (
    <div className={cn("rp-wrap a-page", !!primaryAction && "a-split", className)}>
      <ResultCard slug={slug} kicker={kickerLine} verdict={outcome} value={value} max={fraction} unit={unit} facts={facts}
        note={personalBest ? "New personal best" : undefined} clay={plate} answer={answer}
        share={share && !dayComplete ? share : undefined} compact={dayComplete ? { kicker: `${game} · today`, line: compactLine } : undefined}
        animate={animateScore} label={`${game} result`} srScore={`${game} result: ${score}`} />
      {failReason ? <p className="rp-fail t-meta" role="alert">Not saved: {failReason}.</p> : null}
      {primaryAction ? <div className="a-lb rp-primary">{primaryAction}</div> : null}
      {daily || actions || (mode === "lockout" && clock) ? <div className="a-next">
        {daily ? <DailyNext {...daily} onShareDay={daily.onShareDay ?? share?.onShare} /> : null}
        {actions ? <div className="rp-actions">{actions}</div> : null}
        {!daily && mode === "lockout" && clock ? <div className="daily-tomorrow"><Countdown label="New boards in" resetAt={clock.resetAt} serverNow={clock.serverNow} /></div> : null}
      </div> : null}
      {review ? <div className="a-review rp-rows">{review}</div> : null}
      {children ? <div className="a-more rp-rows">{children}</div> : null}
      {links}
      {feedback ? <div className="a-fb rp-feedback">{feedback}</div> : null}
    </div>
  );
}
