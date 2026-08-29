import type { RunDetailProps } from "@/games/types";

const KEYS: { key: string; label: string; format?: (v: number) => string }[] = [
  { key: "score", label: "score" },
  { key: "total", label: "of" },
  { key: "streak", label: "streak" },
  { key: "bestStreak", label: "best streak" },
  { key: "avgError", label: "avg error", format: (v) => `${v} %` },
  { key: "accuracy", label: "accuracy", format: (v) => `${v} %` },
  { key: "correct", label: "right" },
  { key: "rounds", label: "rounds" },
];

/**
 * The run page rows for games without their own detail (blueprint 7.7): the known resultJson
 * keys as label / Erode value rows. Unknown or missing keys are skipped, never printed raw.
 */
export function GenericDetail({ run }: RunDetailProps) {
  const json = run.resultJson ?? {};
  const rows = KEYS.filter((k) => typeof json[k.key] === "number").map((k) => ({
    label: k.label,
    value: k.format ? k.format(json[k.key] as number) : String(json[k.key] as number),
  }));
  if (rows.length === 0) return null;
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
