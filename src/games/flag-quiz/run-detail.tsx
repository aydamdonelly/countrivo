import type { RunDetailProps } from "@/games/types";

const FLAGS = 10;
const DOUBLE_FROM = 7;

/**
 * The run rows behind a shared Flag Quiz run. The saved resultJson is
 * `{ v: 2, score, total, answers, hits }`, total being the 13-point maximum. `hits` marks
 * each of the ten flags right or wrong, so the rows split the run into the seven single
 * flags and the three lookalikes that count double. The flags are not named back: a run page can be opened while the day's board is
 * still live. A run saved under the old ten-point rules (no `hits`) prints its old split.
 */
export function RunDetail({ run }: RunDetailProps) {
  const json = run.resultJson ?? {};
  const hits = isHits(json.hits) ? json.hits : null;

  if (!hits) {
    const total = typeof json.total === "number" ? json.total : run.scoreMax;
    const named = typeof json.score === "number" ? json.score : run.scoreRaw;
    if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(named) || named < 0 || named > total) return null;
    return <Rows rows={[["named", `${named}`, false], ["missed", `${total - named}`, total - named > 0]]} />;
  }

  const single = hits.slice(0, DOUBLE_FROM).filter(Boolean).length;
  const double = hits.slice(DOUBLE_FROM).filter(Boolean).length;
  return (
    <Rows
      rows={[
        ["flags 1 to 7", `${single} of ${DOUBLE_FROM}`, single < DOUBLE_FROM],
        ["lookalikes, counting double", `${double} of ${FLAGS - DOUBLE_FROM}`, double < FLAGS - DOUBLE_FROM],
      ]}
    />
  );
}

function isHits(v: unknown): v is boolean[] {
  return Array.isArray(v) && v.length === FLAGS && v.every((h) => typeof h === "boolean");
}

function Rows({ rows }: { rows: readonly (readonly [string, string, boolean])[] }) {
  return (
    <div className="rrows t-row">
      {rows.map(([label, value, bad]) => (
        <div key={label} className="rrow" style={{ gridTemplateColumns: "1fr auto" }}>
          <span className="nm">{label}</span>
          <b className={`v t-score num${bad ? " bad" : ""}`}>{value}</b>
        </div>
      ))}
    </div>
  );
}
