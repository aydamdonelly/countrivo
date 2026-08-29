import type { CSSProperties } from "react";
import { getCategoryBySlug } from "@/lib/data/categories";
import { StatIcon } from "@/ui/icons/stat";
import type { RunDetailProps } from "@/games/types";
import { GenericDetail } from "@/games/_shared/generic-detail";
import { statLabel } from "@/games/_shared/format";

const COLS: CSSProperties = { gridTemplateColumns: "26px minmax(0, 1fr) auto" };

/**
 * The run page rows (blueprint 7.7). A saved Population Sort run keeps the score and the
 * statistic, not the six countries, so the row names the statistic that was sorted and how
 * much of the order held; a run from before that key existed falls back to the generic rows.
 */
export function RunDetail({ run }: RunDetailProps) {
  const json = run.resultJson ?? {};
  const slug = typeof json.category === "string" ? json.category : null;
  const category = slug ? getCategoryBySlug(slug) : undefined;
  if (!category) return <GenericDetail run={run} />;
  const score = typeof json.score === "number" ? json.score : run.scoreRaw;
  const total = typeof json.total === "number" ? json.total : run.scoreMax;
  return (
    <div className="rrows t-row">
      <div className="rrow" style={COLS}>
        <StatIcon slug={category.slug} size={20} />
        <span className="nm">
          {statLabel(category.slug, category.label)}
          <small>highest first</small>
        </span>
        <b className="v t-score num">{`${score} / ${total}`}</b>
      </div>
    </div>
  );
}
