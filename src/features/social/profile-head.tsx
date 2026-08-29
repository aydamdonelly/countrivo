import { Crest } from "@/ui/crest";
import { Flame } from "@/ui/flame";

export interface ProfileHeadProps {
  name: string;
  username: string;
  crest: string | null;
  streak: number;
  longest: number;
  /** The viewer's own profile: the ember ring and the crest nudge. */
  own?: boolean;
  hasCountry?: boolean;
  /** True when StreakWeek follows: it owns the streak, so the hero does not say it twice. */
  weekFollows?: boolean;
}

/**
 * The profile hero (blueprint 7.16): crest 64, the name, the handle and the streak line.
 * The flame is the brand mark, so it burns at zero too; only the number is withheld. On the
 * viewer's own profile the StreakWeek block below owns the streak, so the hero drops the line
 * rather than printing the same flame, number and words twice.
 */
export function ProfileHead({ name, username, crest, streak, longest, own, hasCountry, weekFollows }: ProfileHeadProps) {
  const line = !weekFollows;
  return (
    <header className="ph">
      <Crest path={crest} size={64} ring={own} label={name} />
      <div className="who">
        <h1 className="t-h1">{name}</h1>
        <p className="at t-meta">
          @{username}
          {own && !hasCountry ? " · Pick a country and you get a crest." : ""}
        </p>
        {line ? (
          <p className="streak">
            <Flame size={18} />
            {streak > 0 ? (
              <>
                <b className="t-score-l num">{streak}</b>
                <small className="t-body">
                  day streak{longest > 0 ? ` · best ${longest}` : ""}
                </small>
              </>
            ) : (
              <small className="t-body">No streak yet. One shot starts it.</small>
            )}
          </p>
        ) : null}
      </div>
    </header>
  );
}
