import { draftConquestMap } from "@/lib/data/draft-map";
import { takenAt } from "@/lib/game-logic/country-draft/fill-order";
import { MAX_SCORE } from "@/lib/game-logic/country-draft/tables";

const MAP = draftConquestMap;

export interface DraftMapProps {
  /** The five round countries, in round order: the map fills outward from them. */
  from: readonly string[];
  /** 0 to 195. */
  score: number;
  className?: string;
  reveal?: boolean;
  onRevealEnd?: () => void;
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
export function DraftMap({ from, score, className, reveal = false, onRevealEnd }: DraftMapProps) {
  const taken = takenAt(from, score);
  const waveSize = Math.max(1, Math.ceil(taken.length / 3));
  const waves = [taken.slice(0, waveSize), taken.slice(waveSize, waveSize * 2), taken.slice(waveSize * 2)];
  return (
    <svg
      className={`dr-map${reveal ? " dr-map-revealing" : ""}${className ? ` ${className}` : ""}`}
      viewBox={MAP.viewBox}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${Math.max(0, Math.min(MAX_SCORE, score))} of ${MAX_SCORE} countries taken`}
    >
      <path className="dr-map-land" d={MAP.land} fill="var(--color-wait)" />
      {waves.map((wave, index) => <g key={index} className={`dr-map-wave dr-map-wave-${index}`} onAnimationEnd={index === 2 ? onRevealEnd : undefined}>
        {wave.map(iso3 => MAP.countries[iso3] ? <path className="dr-map-taken" key={iso3} d={MAP.countries[iso3]} fill="var(--color-ink)" /> : null)}
      </g>)}
    </svg>
  );
}
