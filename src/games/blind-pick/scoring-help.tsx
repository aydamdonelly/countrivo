import { statDefinition, statWording, WORLD_RANK_EXPLANATION, WORLD_RANK_LABEL } from "@/lib/game-logic/blind-pick/display";

export function ScoringHelp({ stats }: { stats: readonly string[] }) {
  return <details className="bp-scoring">
    <summary>How scoring works</summary>
    <div className="bp-scoring-copy">
      <p>{WORLD_RANK_LABEL}. {WORLD_RANK_EXPLANATION}</p>
      <p>Great rank = top 10%, strong = top 25%, mid = top half, weak = bottom half. These labels describe the world rank in that category. A weaker rank can still be the best fit for your {stats.length} countries.</p>
      <p>The best fit uses these same {stats.length} countries, each exactly once, for the lowest total world rank. Your score is the extra rank points above it. Zero is perfect.</p>
      <p>Countries arrive one at a time. The next country stays hidden.</p>
      <dl>{stats.map(slug => <div key={slug}><dt>{statWording(slug)}</dt><dd>{statDefinition(slug)}</dd></div>)}</dl>
    </div>
  </details>;
}
