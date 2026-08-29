import conquest from "@/assets/marks/conquest.json";
import { cn } from "@/lib/utils";

const MAP = conquest as { viewBox: string; land: string; countries: Record<string, string> };

/** ISO3 codes with a precomputed outline in conquest.json. */
export const CONQUEST_COUNTRIES = Object.keys(MAP.countries);

export interface ConquestMapProps {
  /** Rendered width in px (the viewBox is 320x150). Omit for width: 100%. */
  width?: number | string;
  height?: number | string;
  /** ISO3 codes drawn as taken; defaults to the five of the World Draft mark. */
  taken?: readonly string[];
  /** On paper: land wait, taken ink. On ink: land ink-2, taken paper. */
  tone?: "paper" | "ink";
  /** "meet" keeps the whole map; "slice" fills the box (the world card uses slice). */
  fit?: "meet" | "slice";
  className?: string;
  title?: string;
}

/**
 * Natural Earth land with a few countries filled (blueprint 3.36), precomputed by
 * scripts/build-marks.mjs; no d3 in the client bundle. Used at 40x26 as the World
 * Draft mark and at 314x120 on the world card.
 */
export function ConquestMap({ width, height, taken = CONQUEST_COUNTRIES, tone = "paper", fit = "meet", className, title }: ConquestMapProps) {
  const land = tone === "ink" ? "var(--color-ink-2)" : "var(--color-wait)";
  const fill = tone === "ink" ? "var(--color-paper)" : "var(--color-ink)";
  return (
    <svg
      className={cn("ic", className)}
      viewBox={MAP.viewBox}
      width={width}
      height={height}
      preserveAspectRatio={fit === "slice" ? "xMidYMid slice" : "xMidYMid meet"}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path d={MAP.land} fill={land} />
      {taken.map((iso3) => (MAP.countries[iso3] ? <path key={iso3} d={MAP.countries[iso3]} fill={fill} /> : null))}
    </svg>
  );
}
