import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Countdown } from "@/ui/countdown";
import { CountUp } from "@/ui/count-up";

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
  if (code === "not_authenticated") return "not signed in";
  return "something went wrong";
}

/**
 * The ink result card (blueprint 3.24): kicker row, the Erode 56 score, the ranks block,
 * the practice note; below it the rows and the action row the host passes in.
 */
/** Splits `1 280 pts` into its leading number and the rest, or null when the score does not start with one. */
function splitScore(score: string): { n: number; digits: string; rest: string } | null {
  const m = score.match(/^(\d[\d ]*)(.*)$/);
  if (!m) return null;
  const digits = m[1].trimEnd();
  const n = Number(digits.replace(/ /g, ""));
  if (!Number.isFinite(n)) return null;
  return { n, digits, rest: score.slice(digits.length) };
}

export function ResultPanel({ mode, game, score, kicker, counter, ranks, personalBest, failReason, practiceHref, clock, actions, children, animateScore, className }: ResultPanelProps) {
  const k =
    kicker ?? (mode === "practice" ? `PRACTICE · ${game.toUpperCase()}` : "TODAY · YOUR SHOT");
  const c = counter ?? (mode === "practice" ? "doesn't count" : mode === "shared" ? undefined : "holds till 00:00");
  return (
    <div className={cn("rp-wrap", className)}>
      <section className="rp on-ink">
        <div className="k t-kicker">
          <span>{k}</span>
          {c ? <span>{c}</span> : null}
        </div>
        <b className="score t-score-xl num">
          {(() => {
            const parts = animateScore ? splitScore(score) : null;
            if (!parts) return score;
            const spaced = parts.digits.includes(" ");
            return (
              <>
                <CountUp value={parts.n} duration={600} kind={spaced ? "grouped" : "int"} />
                {parts.rest}
              </>
            );
          })()}
        </b>
        {ranks ? (
          <p className="ranks t-body">
            {mode === "practice" ? (
              ranks.best ? (
                <>
                  best <b className="num">{ranks.best}</b>
                </>
              ) : null
            ) : (
              <>
                <b className="num">#{ranks.globalRank ?? "–"}</b> of {ranks.globalShots} global
                {ranks.friendCount > 0 ? (
                  <>
                    <br />
                    <b className="num">#{ranks.friendRank ?? "–"}</b> of {ranks.friendCount} friends
                  </>
                ) : null}
              </>
            )}
          </p>
        ) : null}
        {personalBest ? <p className="pb-line t-body">New personal best</p> : null}
        {mode === "daily" || mode === "lockout" ? (
          <p className="note t-body">
            {mode === "lockout" ? "You've shot today. " : "Bad day? "}
            <Link href={practiceHref ?? "?mode=practice"}>Practice a board</Link>, it won&apos;t count.
          </p>
        ) : null}
        {mode === "lockout" && clock ? (
          <p className="next t-body">
            <Countdown label="next board in" resetAt={clock.resetAt} serverNow={clock.serverNow} />
          </p>
        ) : null}
      </section>
      {failReason ? <p className="rp-fail t-meta">Couldn&apos;t save this shot ({failReason}).</p> : null}
      {children ? <div className="rp-rows">{children}</div> : null}
      {actions ? <div className="rp-actions">{actions}</div> : null}
    </div>
  );
}
