import { getSilhouettePath } from "@/lib/silhouettes";
import { Silhouette } from "./silhouette";

/**
 * One mark per game, each saying what the game is: Chile for Higher or Lower
 * (long and narrow), a dashed mystery outline for GeoWordle, the 8-slot board
 * for Country Draft, chips for Risk Zone. Server component (reads path data).
 */
export function GameMark({ slug, size = 28, className = "" }: { slug: string; size?: number; className?: string }) {
  const s = size;
  const common = { width: s, height: s, viewBox: "0 0 28 28", "aria-hidden": true as const, className };
  switch (slug) {
    case "country-draft":
      return (
        <svg {...common}>
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={2 + i * 6.5} y={4} width={5} height={8} rx={1.2} fill="currentColor" opacity={i < 3 ? 1 : 0.25} />
              <rect x={2 + i * 6.5} y={16} width={5} height={8} rx={1.2} fill="currentColor" opacity={i < 1 ? 1 : 0.25} />
            </g>
          ))}
        </svg>
      );
    case "world-draft": {
      const ids = ["BRA", "NGA", "AUS", "JPN", "CHL", "DEU"];
      const pos = [[2, 8], [10, 4], [18, 12], [17, 1], [4, 17], [11, 16]];
      return (
        <svg {...common}>
          {ids.map((iso, i) => {
            const d = getSilhouettePath(iso);
            if (!d) return null;
            return (
              <g key={iso} transform={`translate(${pos[i][0]} ${pos[i][1]}) scale(0.1)`}>
                <path d={d} fill="currentColor" opacity={i < 3 ? 1 : 0.28} />
              </g>
            );
          })}
        </svg>
      );
    }
    case "higher-or-lower": {
      const d = getSilhouettePath("CHL");
      return d ? <Silhouette d={d} size={s} className={className} /> : null;
    }
    case "geo-wordle": {
      const d = getSilhouettePath("ISL");
      return d ? <Silhouette d={d} size={s} dashed className={className} /> : null;
    }
    case "cluster":
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="4.2" fill="currentColor" />
          <circle cx="20" cy="8" r="4.2" fill="currentColor" opacity=".35" />
          <circle cx="8" cy="20" r="4.2" fill="currentColor" opacity=".35" />
          <circle cx="20" cy="20" r="4.2" fill="currentColor" />
          <path d="M8 12v4M12 8h4M12 20h4M20 12v4" stroke="currentColor" strokeWidth="1.6" opacity=".5" />
        </svg>
      );
    case "stat-guesser":
      return (
        <svg {...common}>
          <rect x="3" y="14" width="5" height="11" rx="1" fill="currentColor" opacity=".35" />
          <rect x="11.5" y="7" width="5" height="18" rx="1" fill="currentColor" />
          <rect x="20" y="11" width="5" height="14" rx="1" fill="currentColor" opacity=".35" />
          <path d="M2 5h24" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 2" />
        </svg>
      );
    case "risk-zone":
      return (
        <svg {...common}>
          <ellipse cx="14" cy="21" rx="10" ry="4" fill="currentColor" opacity=".35" />
          <ellipse cx="14" cy="16" rx="10" ry="4" fill="currentColor" opacity=".6" />
          <ellipse cx="14" cy="11" rx="10" ry="4" fill="currentColor" />
          <ellipse cx="14" cy="11" rx="4" ry="1.6" fill="var(--color-bg)" />
        </svg>
      );
    case "flag-quiz":
    case "speed-flags":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 25V4" />
          <path d="M6 5h15l-3 5 3 5H6" />
          {slug === "speed-flags" && <path d="M23 20h3M22 24h4" opacity=".5" />}
        </svg>
      );
    case "capital-match":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 25s-8-7-8-13a8 8 0 0 1 16 0c0 6-8 13-8 13z" />
          <circle cx="14" cy="12" r="2.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case "population-sort":
      return (
        <svg {...common}>
          <rect x="3" y="18" width="5" height="7" rx="1" fill="currentColor" opacity=".35" />
          <rect x="11.5" y="12" width="5" height="13" rx="1" fill="currentColor" opacity=".6" />
          <rect x="20" y="4" width="5" height="21" rx="1" fill="currentColor" />
        </svg>
      );
    case "country-streak":
    case "blitz":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3L6 15h7l-1 10 9-13h-7l1-9z" />
        </svg>
      );
    case "border-buddies": {
      const a = getSilhouettePath("ESP"), b = getSilhouettePath("PRT");
      return (
        <svg {...common}>
          {a && <g transform="translate(6 3) scale(0.22)"><path d={a} fill="currentColor" /></g>}
          {b && <g transform="translate(1 6) scale(0.13)"><path d={b} fill="currentColor" opacity=".45" /></g>}
        </svg>
      );
    }
    case "continent-sprint": {
      const d = getSilhouettePath("AUS");
      return d ? <Silhouette d={d} size={s} className={className} /> : null;
    }
    case "odd-one-out":
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="4" fill="currentColor" /><circle cx="20" cy="8" r="4" fill="currentColor" />
          <circle cx="8" cy="20" r="4" fill="currentColor" /><circle cx="20" cy="20" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "supremacy":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 20l-1.5-11 6 4.5L14 6l4.5 7.5 6-4.5L23 20z" /><path d="M6 24h16" />
        </svg>
      );
    case "borderline":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 20c4-2 5-9 9-9s5 8 9 6 4-9 4-9" strokeDasharray="4 3" />
        </svg>
      );
    default:
      return (
        <svg {...common}><circle cx="14" cy="14" r="9" fill="currentColor" /></svg>
      );
  }
}
