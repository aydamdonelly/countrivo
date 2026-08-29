import type { RunDetailProps } from "@/games/types";
import { SPEED_SECONDS } from "./module";

function count(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * The rows behind a shared Speed Flags run (blueprint 7.7). The saved resultJson carries
 * only the three counts, so the run page prints those three and nothing else; the generic
 * fallback would have labelled `total` as "of", which reads as half a sentence.
 */
export function RunDetail({ run }: RunDetailProps) {
  const json = run.resultJson ?? {};
  const correct = count(json.correct);
  if (correct === null) return null;
  const total = count(json.total);
  const stored = count(json.accuracy);
  const acc = stored ?? (total !== null && total > 0 ? Math.round((correct / total) * 100) : null);

  const rows = [
    { label: "flags right", value: String(correct) },
    ...(total === null ? [] : [{ label: `called in ${SPEED_SECONDS} s`, value: String(total) }]),
    ...(acc === null ? [] : [{ label: "accuracy", value: `${acc} %` }]),
  ];

  return (
    <div className="rrows t-row">
      {rows.map((r) => (
        <div key={r.label} className="rrow" style={{ gridTemplateColumns: "1fr auto" }}>
          <span className="nm">{r.label}</span>
          <b className="v t-score num">{r.value}</b>
        </div>
      ))}
    </div>
  );
}
