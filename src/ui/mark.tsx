import silhouettes from "@/data/mark-silhouettes.json";
import type { GameSlug } from "@/ui/types";
import { ConquestMap } from "@/ui/conquest-map";

const SIL = silhouettes as Record<string, string>;

/** Every mark shares one grid: the 28 box, 2 px strokes, round joins. */
const MARK_K = 28 / 100;

export interface MarkProps {
  slug: GameSlug;
  /** Box size in px; the wrapper is round(size * 1.6) wide. */
  size?: number;
  /** Ink by default; paper on ink surfaces. */
  tone?: "ink" | "paper";
  className?: string;
  title?: string;
}

/**
 * A silhouette from the 100 box, scaled so its LONG side fills `box` and centred in it.
 * Without this a thin country (Chile) renders as a 5 px sliver beside a wide one (Iceland)
 * and the set loses the one grid it is supposed to share.
 */
const SIL_BOX: Record<string, [number, number, number, number]> = {
  // x, y, w, h of the drawn ink inside the 100 box, measured with getBBox (scripts note in the PR).
  CHL: [41.5, 2, 16.9, 96],
  ISL: [2, 17.8, 96, 64.3],
  AUS: [2, 4.8, 96, 90.3],
  ESP: [2, 10.7, 96, 78.5],
  PRT: [28.6, 2, 42.7, 96],
  BRA: [4.2, 2, 91.5, 96],
  NGA: [2, 10.5, 96, 78.9],
  JPN: [8.3, 2, 83.3, 96],
  DEU: [14.7, 2, 70.5, 96],
  NOR: [32.4, 2, 35.1, 96],
  ARG: [28.5, 2, 42.9, 96],
  MDG: [25.8, 2, 48.3, 96],
};

function Sil({ iso3, box, x = 0, y = 0, opacity }: { iso3: string; box: number; x?: number; y?: number; opacity?: number }) {
  const [bx, by, bw, bh] = SIL_BOX[iso3] ?? [0, 0, 100, 100];
  const k = box / Math.max(bw, bh);
  const dx = x + (box - bw * k) / 2 - bx * k;
  const dy = y + (box - bh * k) / 2 - by * k;
  return <path d={SIL[iso3]} transform={`translate(${dx} ${dy}) scale(${k})`} opacity={opacity} />;
}

function Drawing({ slug, c }: { slug: GameSlug; c: string }) {
  switch (slug) {
    case "blind-pick":
      return (
        <g fill={c}>
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={2 + i * 6.5} y="4" width="5" height="8" rx="1.2" opacity={i < 3 ? 1 : 0.25} />
              <rect x={2 + i * 6.5} y="16" width="5" height="8" rx="1.2" opacity={i < 1 ? 1 : 0.25} />
            </g>
          ))}
        </g>
      );
    case "higher-or-lower":
      return <g fill={c}><Sil iso3="CHL" box={28} /></g>;
    case "geo-wordle":
      return (
        <g fill="none" stroke={c} strokeWidth={2 / MARK_K} strokeDasharray={`${3 / MARK_K} ${3 / MARK_K}`} strokeLinejoin="round">
          <Sil iso3="ISL" box={28} />
        </g>
      );
    case "stat-guesser":
      return (
        <g fill={c}>
          <rect x="3" y="14" width="5" height="11" rx="1" opacity=".35" />
          <rect x="11.5" y="7" width="5" height="18" rx="1" />
          <rect x="20" y="11" width="5" height="14" rx="1" opacity=".35" />
          <path d="M2 5h24" stroke={c} strokeWidth="2" strokeDasharray="2 2" fill="none" strokeLinecap="round" />
        </g>
      );
    case "flag-quiz":
      return (
        <g fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 25V4" />
          <path d="M6 5h15l-3 5 3 5H6" />
        </g>
      );
    case "speed-flags":
      return (
        <g fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 25V4" />
          <path d="M9 5h15l-3 5 3 5H9" />
          <path d="M2 9h3M1 13h3M2 17h3" opacity=".35" />
        </g>
      );
    case "country-draft":
      return null;
  }
}

/**
 * One bespoke SVG per game (blueprint 4.3) inside a wrapper round(size * 1.6) wide.
 * Country Draft is the conquest map at 1.55:1.
 */
export function Mark({ slug, size = 26, tone = "ink", className, title }: MarkProps) {
  const c = tone === "paper" ? "var(--color-paper)" : "var(--color-ink)";
  const wrap = Math.round(size * 1.6);
  const cls = className ? `mk ${className}` : "mk";
  if (slug === "country-draft") {
    return (
      <span className={cls} style={{ width: wrap }}>
        <ConquestMap width={Math.round(size * 1.55)} height={size} tone={tone === "paper" ? "ink" : "paper"} title={title} />
      </span>
    );
  }
  return (
    <span className={cls} style={{ width: wrap }}>
      <svg width={size} height={size} viewBox="0 0 28 28" role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
        {title ? <title>{title}</title> : null}
        <Drawing slug={slug} c={c} />
      </svg>
    </span>
  );
}
