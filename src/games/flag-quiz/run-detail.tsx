import type { RunDetailProps } from "@/games/types";

/**
 * The run rows behind a shared Flag Quiz run (blueprint 7.7). The saved resultJson is the
 * frozen submission shape `{ score, total, answers }`, and `answers` holds option indices,
 * not countries: the ten flags cannot be named back honestly (the board seed is the day's
 * edition seed, which the run row does not carry), so the rows print the split instead of
 * inventing a list. GenericDetail would label the second number `of`, which is a sentence
 * fragment, not a row label.
 */
export function RunDetail({ run }: RunDetailProps) {
  const json = run.resultJson ?? {};
  const total = typeof json.total === "number" ? json.total : run.scoreMax;
  const named = typeof json.score === "number" ? json.score : run.scoreRaw;
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(named) || named < 0 || named > total) return null;
  const missed = total - named;

  return (
    <div className="rrows t-row">
      <div className="rrow" style={{ gridTemplateColumns: "1fr auto" }}>
        <span className="nm">named</span>
        <b className="v t-score num">{named}</b>
      </div>
      <div className="rrow" style={{ gridTemplateColumns: "1fr auto" }}>
        <span className="nm">missed</span>
        <b className={`v t-score num${missed > 0 ? " bad" : ""}`}>{missed}</b>
      </div>
    </div>
  );
}
