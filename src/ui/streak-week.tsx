import { cn } from "@/lib/utils";
import { Flame } from "@/ui/flame";

export interface WeekDay {
  /** `Tu`, `We`... */
  label: string;
  /** Dailies shot that day; null for days that have not happened. */
  played: number | null;
  /** Dailies available that day. */
  total: number;
  today?: boolean;
}

export interface StreakWeekProps {
  /** profiles.streak_current. */
  n: number;
  days: readonly WeekDay[];
  className?: string;
}

/**
 * Profile streak block (blueprint 3.12): Flame 36 + the Erode 56 number + two mute lines,
 * then seven 44 px tiles. Played = ink fill; today = 2 px ink inset outline. No streak:
 * the flame stays lit, the number is omitted, the text reads "No streak yet. One shot starts it."
 */
export function StreakWeek({ n, days, className }: StreakWeekProps) {
  return (
    <section className={cn("streak", className)}>
      <div className="n">
        <Flame size={36} />
        {n > 0 ? <b className="t-score-xl num">{n}</b> : null}
        <small className="t-body">
          {n > 0 ? (
            <>
              day streak
              <br />
              play any daily to keep it
            </>
          ) : (
            <>
              No streak yet.
              <br />
              One shot starts it.
            </>
          )}
        </small>
      </div>
      <div className="week">
        {days.map((d) => (
          <span key={d.label} className={cn("t-meta", d.today ? "t" : d.played != null && d.played > 0 ? "on" : undefined)}>
            {d.label}
            {d.played != null ? (
              <i className="num">
                {d.played}/{d.total}
              </i>
            ) : null}
          </span>
        ))}
      </div>
    </section>
  );
}
