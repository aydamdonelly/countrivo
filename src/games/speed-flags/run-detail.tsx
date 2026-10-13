import type { RunDetailProps } from "@/games/types";
import { SPEED_SECONDS } from "./module";

function count(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * The rows behind a shared Speed Flags run (blueprint 7.7). The saved resultJson carries
 * counts only: right, wrong (30-second rules) and answers given. Runs from the 20-second
 * rules carry no `wrong` and no `seconds`; they print what they have under their own length.
 */
export function RunDetail({ run }: RunDetailProps) {
  const json = run.resultJson ?? {};
  const correct = count(json.correct);
  if (correct === null) return null;
  const wrong = count(json.wrong);
  const total = count(json.total);
  const seconds = count(json.seconds) ?? (wrong === null ? 20 : SPEED_SECONDS);

  const rows = [
    { label: `right in ${seconds} seconds`, value: String(correct) },
    ...(wrong === null ? [] : [{ label: wrong === 1 ? "wrong, 3 seconds off" : "wrong, 3 seconds off each", value: String(wrong) }]),
    ...(total === null ? [] : [{ label: "flags answered", value: String(total) }]),
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
