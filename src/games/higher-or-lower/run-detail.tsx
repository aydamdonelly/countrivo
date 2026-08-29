import type { RunDetailProps } from "@/games/types";

/**
 * The run page rows (blueprint 7.7): the streak and what ended it. GenericDetail would print
 * `streak` and `best streak` as two rows, and in this engine the best streak IS the streak
 * (one wrong call ends the run), so the second row would repeat the first number. This one
 * prints the streak once and says how the run finished instead.
 */
export function RunDetail({ run }: RunDetailProps) {
  const json = run.resultJson ?? {};
  const streak = typeof json.streak === "number" ? json.streak : null;
  const last = json.lastAnswer;
  const ended = last === "wrong" ? "a wrong call" : last === "correct" ? "the rounds ran out" : null;
  if (streak === null && ended === null) return null;
  return (
    <div className="rrows t-row">
      {streak === null ? null : (
        <div className="rrow" style={{ gridTemplateColumns: "1fr auto" }}>
          <span className="nm">streak</span>
          <b className="v t-score num">{streak}</b>
        </div>
      )}
      {ended === null ? null : (
        <div className="rrow" style={{ gridTemplateColumns: "1fr auto" }}>
          <span className="nm">ended</span>
          <span className="v mute t-meta">{ended}</span>
        </div>
      )}
    </div>
  );
}
