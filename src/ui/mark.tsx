import silhouettes from "@/data/mark-silhouettes.json";
import type { GameSlug } from "@/ui/types";
import { ConquestMap } from "@/ui/conquest-map";

const SIL = silhouettes as Record<string, string>;

export interface MarkProps {
  slug: GameSlug;
  /** Box size in px; the wrapper is round(size * 1.6) wide. */
  size?: number;
  /** Ink by default; paper on ink surfaces. */
  tone?: "ink" | "paper";
  className?: string;
  title?: string;
}

const PIN = "M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z";
const BOLT = "M13 3L5 13h6l-1 8 9-11h-6l1-7z";

/** A silhouette from the 100 box scaled into `box` px, offset by (x, y). */
function Sil({ iso3, box, x = 0, y = 0, opacity }: { iso3: string; box: number; x?: number; y?: number; opacity?: number }) {
  const k = box / 100;
  return <path d={SIL[iso3]} transform={`translate(${x} ${y}) scale(${k})`} opacity={opacity} />;
}

function Drawing({ slug, c }: { slug: GameSlug; c: string }) {
  switch (slug) {
    case "country-draft":
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
        <g fill="none" stroke={c} strokeWidth={2.2 / 0.28} strokeDasharray={`${3 / 0.28} ${3 / 0.28}`} strokeLinejoin="round">
          <Sil iso3="ISL" box={28} />
        </g>
      );
    case "cluster":
      return (
        <g fill={c}>
          <circle cx="8" cy="8" r="4.2" />
          <circle cx="20" cy="8" r="4.2" opacity=".35" />
          <circle cx="8" cy="20" r="4.2" opacity=".35" />
          <circle cx="20" cy="20" r="4.2" />
          <path d="M8 12v4M12 8h4M12 20h4M20 12v4" stroke={c} strokeWidth="1.6" opacity=".5" fill="none" />
        </g>
      );
    case "stat-guesser":
      return (
        <g fill={c}>
          <rect x="3" y="14" width="5" height="11" rx="1" opacity=".35" />
          <rect x="11.5" y="7" width="5" height="18" rx="1" />
          <rect x="20" y="11" width="5" height="14" rx="1" opacity=".35" />
          <path d="M2 5h24" stroke={c} strokeWidth="1.6" strokeDasharray="2 2" fill="none" />
        </g>
      );
    case "risk-zone":
      return (
        <g fill={c}>
          <ellipse cx="14" cy="21" rx="10" ry="4" opacity=".35" />
          <ellipse cx="14" cy="16" rx="10" ry="4" opacity=".6" />
          <ellipse cx="14" cy="11" rx="10" ry="4" />
          <ellipse cx="14" cy="11" rx="4" ry="1.6" fill={c === "var(--color-paper)" ? "var(--color-ink)" : "var(--color-paper)"} />
        </g>
      );
    case "flag-quiz":
      return (
        <g fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 25V4" />
          <path d="M6 5h15l-3 5 3 5H6" />
        </g>
      );
    case "capital-match":
      return (
        <g>
          <g fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="translate(2 0) scale(1.1667)">
            <path d={PIN} />
          </g>
          <circle cx="16" cy="11.7" r="1.7" fill={c} />
          <rect x="14" y="24.5" width="4" height="3" rx="1" fill={c} />
        </g>
      );
    case "population-sort":
      return (
        <g fill={c}>
          <rect x="3" y="5" width="18" height="4" rx="1" />
          <rect x="3" y="12" width="12" height="4" rx="1" opacity=".35" />
          <rect x="3" y="19" width="8" height="4" rx="1" />
        </g>
      );
    case "country-streak":
      return (
        <g fill={c}>
          <Sil iso3="JPN" box={14} x={0} y={7} />
          <Sil iso3="JPN" box={10} x={14.5} y={9} opacity={0.45} />
          <Sil iso3="JPN" box={7} x={22} y={10.5} opacity={0.2} />
        </g>
      );
    case "border-buddies":
      return (
        <g fill={c}>
          <Sil iso3="PRT" box={13} x={1} y={9} />
          <Sil iso3="ESP" box={22} x={8} y={3} opacity={0.35} />
        </g>
      );
    case "odd-one-out":
      return (
        <g fill={c}>
          <circle cx="5" cy="14" r="3.5" />
          <circle cx="11" cy="14" r="3.5" />
          <circle cx="17" cy="14" r="2.5" fill="none" stroke={c} strokeWidth="2" />
          <circle cx="23" cy="14" r="3.5" />
        </g>
      );
    case "continent-sprint":
      return (
        <g>
          <g fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="scale(1.1667)">
            <circle cx="12" cy="13" r="7" />
            <path d="M12 3v3" />
            <path d="M9 3h6" />
          </g>
          <g fill={c}>
            <Sil iso3="NGA" box={15.4} x={14 - 7.7} y={15.17 - 7.7} />
          </g>
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
    case "supremacy":
      return (
        <g fill={c}>
          <rect x="3" y="6" width="12" height="16" rx="2" opacity=".35" />
          <rect x="11" y="4" width="12" height="16" rx="2" />
        </g>
      );
    case "borderline":
      return (
        <g>
          <path d="M3 21L9 12l6 3 9-9" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="3" cy="21" r="2" fill={c} />
          <circle cx="24" cy="6" r="2" fill={c} />
        </g>
      );
    case "blitz":
      return (
        <g>
          <path d={BOLT} fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="scale(1.1667)" />
          <circle cx={11.5 * 1.1667} cy={12.5 * 1.1667} r="1.5" fill={c} />
        </g>
      );
    case "world-draft":
      return null;
  }
}

/**
 * One bespoke SVG per game (blueprint 4.3) inside a wrapper round(size * 1.6) wide.
 * World Draft is the conquest map at 1.55:1.
 */
export function Mark({ slug, size = 26, tone = "ink", className, title }: MarkProps) {
  const c = tone === "paper" ? "var(--color-paper)" : "var(--color-ink)";
  const wrap = Math.round(size * 1.6);
  const cls = className ? `mk ${className}` : "mk";
  if (slug === "world-draft") {
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
