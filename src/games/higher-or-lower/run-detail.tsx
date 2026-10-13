import type { RunDetailProps } from "@/games/types";
import { DAILY_MAX } from "@/lib/game-logic/higher-or-lower/engine";
import { isHoLStat, statMeta } from "@/lib/game-logic/higher-or-lower/stats";

/**
 * The run page rows (blueprint 7.7). A daily run: the points of 13, the stat and how many
 * of the ten calls were right. A practice run: the streak and the stat. Runs saved under the
 * old sudden-death rules carry only `streak` and print that.
 */
export function RunDetail({ run }: RunDetailProps) {
  const json = run.resultJson ?? {};
  const rows: { k: string; v: string; num?: boolean }[] = [];
  const stat = typeof json.stat === "string" && isHoLStat(json.stat) ? statMeta(json.stat).noun : null;
  if (typeof json.points === "number") {
    rows.push({ k: "score", v: `${json.points} of ${DAILY_MAX}`, num: true });
    if (Array.isArray(json.hits)) {
      const right = json.hits.filter((h) => h === true).length;
      rows.push({ k: "right calls", v: `${right} of ${json.hits.length}`, num: true });
    }
  } else if (typeof json.streak === "number") {
    rows.push({ k: "streak", v: String(json.streak), num: true });
  }
  if (stat) rows.push({ k: "stat", v: stat });
  if (rows.length === 0) return null;
  return (
    <div className="rrows t-row">
      {rows.map((r) => (
        <div key={r.k} className="rrow" style={{ gridTemplateColumns: "1fr auto" }}>
          <span className="nm">{r.k}</span>
          {r.num ? <b className="v t-score num">{r.v}</b> : <span className="v mute t-meta">{r.v}</span>}
        </div>
      ))}
    </div>
  );
}
