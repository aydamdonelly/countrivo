import map from "@/assets/marks/draft-map.json";
import { takenAt } from "@/lib/game-logic/country-draft/fill-order";
import { MAX_SCORE } from "@/lib/game-logic/country-draft/tables";

const MAP = map as { viewBox: string; land: string; countries: Record<string, string> };

export interface DraftMapProps {
  /** The five round countries, in round order: the map fills outward from them. */
  from: readonly string[];
  /** 0 to 195. */
  score: number;
  className?: string;
}

/**
 * The result artifact: the world, with as many countries taken as the cabinet scored.
 *
 * It is not decoration standing in for a number. The score is a count out of 195, the
 * artifact is the 195 sovereign states, and the fill order is a real geodesic sort out of
 * the five countries that gave you your cabinet, so the conquest visibly radiates from
 * them and the five are always the first five filled. Two players with the same score on
 * the same day get the same shape, which is what makes it comparable across a screenshot.
 * At 0 it is an empty grey world; at 195 it is solid ink.
 *
 * Two tones of the palette, no stroke, no glow, no gradient, no legend. The 22 states
 * smaller than a pixel at this scale (the Caribbean and Pacific micro-states, Malta,
 * Monaco, San Marino, the Vatican) have no outline in the atlas and are carried by the
 * land layer underneath.
 */
export function DraftMap({ from, score, className }: DraftMapProps) {
  const taken = takenAt(from, score);
  return (
    <svg
      className={className ? `dr-map ${className}` : "dr-map"}
      viewBox={MAP.viewBox}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${Math.max(0, Math.min(MAX_SCORE, score))} of ${MAX_SCORE} countries taken`}
    >
      <path d={MAP.land} fill="var(--color-wait)" />
      {taken.map((iso3) => (MAP.countries[iso3] ? <path key={iso3} d={MAP.countries[iso3]} fill="var(--color-ink)" /> : null))}
    </svg>
  );
}
