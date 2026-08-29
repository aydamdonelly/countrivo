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

/** A silhouette from the 100 box scaled into `box` px, offset by (x, y). */
function Sil({ iso3, box, x = 0, y = 0, opacity }: { iso3: string; box: number; x?: number; y?: number; opacity?: number }) {
  const k = box / 100;
  return <path d={SIL[iso3]} transform={`translate(${x} ${y}) scale(${k})`} opacity={opacity} />;
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
        <g fill="none" stroke={c} strokeWidth={2.2 / 0.28} strokeDasharray={`${3 / 0.28} ${3 / 0.28}`} strokeLinejoin="round">
          <Sil iso3="ISL" box={28} />
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
