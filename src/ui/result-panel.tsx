import { outcomeClay } from "@/content/table";
import { Clay } from "@/ui/clay";
import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Countdown } from "@/ui/countdown";
import { CountUp } from "@/ui/count-up";
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

export interface ResultPanelProps {
  mode: ResultMode;
  /** The game title, for the practice kicker. */
  game: string;
  /** The compact score: `612`, `4/6`, `1 280 pts`, `7 in a row`. */
  score: string;
  /** A short verdict, such as `Country found` or `A strong cabinet`. */
  outcome?: string;
  /** Overrides the kicker (`shared`: `COUNTRY DRAFT · SAT 28 AUG`). */
  kicker?: string;
  counter?: string;
  ranks?: ResultRanks;
  personalBest?: boolean;
  /** A save failure in words (blueprint 10.8). */
  failReason?: string | null;
  practiceHref?: string;
  /** Lockout: the `next board in` line. */
  clock?: { resetAt: number; serverNow: number };
  /** The action row: one ink button plus one text button. */
  actions?: ReactNode;
  /** The main follow-up, immediately after the score and before result details. */
  primaryAction?: ReactNode;
  feedback?: ReactNode;
  /** Counts the leading number of `score` from 0 over 600 ms once (blueprint 6.3.6); the HTML holds the final value. */
  animateScore?: boolean;
  /** The game's result rows (and the join row for guests), under the card. */
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

/** Splits `1 280 pts` into its leading number and the rest, or null when the score does not start with one. */
function splitScore(score: string): { n: number; digits: string; rest: string } | null {
  const m = score.match(/^[+]?(\d[\d ]*)(.*)$/);
  if (!m) return null;
  const digits = m[1].trimEnd();
  const n = Number(digits.replace(/ /g, ""));
  if (!Number.isFinite(n)) return null;
  return { n, digits, rest: m[2] };
}

export function ResultPanel({ mode, game, score, outcome, kicker, counter, ranks, personalBest, failReason, practiceHref, clock, actions, primaryAction, feedback, children, animateScore, className }: ResultPanelProps) {
  const k = kicker ?? (mode === "practice" ? "Practice" : "Today’s result");
  const parts = splitScore(score);
  const unit = parts?.rest.replace(/^\s*of\s+/i, "/").trim();
  const clay = outcomeClay(game, score);
  const parByGame: Record<string, number> = { "Country Draft": 140, GeoWordle: 4, Pinpoint: 720, "Flag Quiz": 9, "Higher or Lower": 9, "Stat Guesser": 300, "Blind Pick": 10 };
  const par = mode === "practice" && game === "Higher or Lower" ? undefined : parByGame[game];
  const value = parts?.n;
  const lowerIsBetter = game === "GeoWordle" || game === "Blind Pick";
  const delta = value !== undefined && par !== undefined ? (lowerIsBetter ? par - value : value - par) : null;
  const c = counter && (delta === null || !/^par\b/i.test(counter)) ? counter : undefined;
  const parLabel = par === undefined ? undefined : `${game === "Blind Pick" ? "+" : ""}${par}`;
  const deltaLabel = delta === null ? undefined : delta === 0 ? "On par" : `${Math.abs(delta)} ${delta > 0 ? "better than" : "off"} par`;
  const scoreLabels: Record<string, string> = { "Flag Quiz": "points", "Higher or Lower": mode === "practice" ? "correct calls" : "points", "Stat Guesser": "points", Pinpoint: "points", GeoWordle: "guesses used", "Blind Pick": "rank places over perfect", "Speed Flags": "flags named in 30 seconds" };
  const verdict = outcome ?? (game === "Speed Flags" ? "Time’s up" : game === "Blind Pick" ? score === "Perfect" ? "Best possible match" : "Board complete" : game === "Stat Guesser" ? "Five estimates complete" : "Round complete");
  return (
    <div className={cn("rp-wrap", animateScore && "rp-arrived", className)}>
      <section className="rp" aria-label={`${game} result`}>
        <div className="rp-heading">
          <div className="k t-meta">
            <span>{k}</span>
            {c ? <span>{c}</span> : null}
          </div>
          <Clay object={clay} className="result-clay" sizes="64px" />
        </div>
        <h2 className="rp-outcome t-h2">{verdict}</h2>
        <p className="score num">
          <span className="sr-only">{game} result: {score}</span>
          <span className="rp-score-content" aria-hidden="true">
            <b className="t-score-xl">{parts ? <>{score.startsWith("+") ? "+" : ""}{animateScore ? <CountUp value={parts.n} duration={600} kind={parts.digits.includes(" ") ? "grouped" : "int"} /> : parts.digits}</> : score}</b>
            {unit ? <span className={cn("score-unit", unit.startsWith("/") && "score-fraction")}>{unit}</span> : null}
          </span>
        </p>
        {scoreLabels[game] ? <p className="rp-score-label t-meta">{scoreLabels[game]}</p> : null}
        {delta !== null ? <p className="result-benchmarks t-meta"><span>Daily target <b className="num">{parLabel}</b></span><span aria-label={deltaLabel}>{delta === 0 ? "Target reached" : <><b className="num">{Math.abs(delta)}</b> {delta > 0 ? "better than target" : "from target"}</>}</span></p> : null}
        {ranks && (mode === "practice" || ranks.globalRank !== null) ? (
          <p className="ranks t-body">
            {mode === "practice" ? (
              ranks.best ? (
                <>
                  best <b className="num">{ranks.best}</b>
                </>
              ) : null
            ) : (
              <>
                <span aria-label={`Rank ${ranks.globalRank} of ${ranks.globalShots} players today`}><b className="num">#{ranks.globalRank}</b> / {ranks.globalShots}</span>
                {ranks.friendCount > 0 ? (
                  <>
                    <br />
                    <b className="num">#{ranks.friendRank ?? "–"}</b> / {ranks.friendCount} friends
                  </>
                ) : null}
              </>
            )}
          </p>
        ) : null}
        {personalBest ? <p className="pb-line t-body">New personal best</p> : null}
        {mode === "lockout" && clock ? (
          <p className="next t-body">
            <Countdown label="next board in" resetAt={clock.resetAt} serverNow={clock.serverNow} />
          </p>
        ) : null}
      </section>
      {failReason ? <p className="rp-fail t-meta" role="alert">Not saved: {failReason}.</p> : null}
      {primaryAction ? <div className="rp-primary">{primaryAction}</div> : null}
      {actions || mode === "daily" || mode === "lockout" ? <div className="rp-actions">{actions}{mode === "daily" || mode === "lockout" ? <Link className="result-practice t-meta" href={practiceHref ?? "?mode=practice"}>Practice</Link> : null}</div> : null}
      {children ? <div className="rp-rows">{children}</div> : null}
      {feedback ? <div className="rp-feedback">{feedback}</div> : null}
    </div>
  );
}
