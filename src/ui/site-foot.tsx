import Link from "next/link";
import { cn } from "@/lib/utils";

const LINES: readonly { lead: string; links: readonly [string, string][] }[] = [
  {
    lead: "Play",
    links: [
      ["Country Draft", "/games/country-draft"],
      ["GeoWordle", "/games/geo-wordle"],
      ["Flag Quiz", "/games/flag-quiz"],
      ["Higher or Lower", "/games/higher-or-lower"],
      ["All games", "/games"],
    ],
  },
  {
    lead: "Browse",
    links: [
      ["Countries", "/countries"],
      ["Rankings", "/categories"],
      ["Lists", "/lists"],
      ["Most populated", "/lists/most-populated-countries"],
      ["Richest", "/lists/richest-countries"],
    ],
  },
  {
    lead: "Countrivo",
    links: [
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
      ["Support", "/support"],
      ["Friends", "/friends"],
      ["Profile", "/profile"],
    ],
  },
];

/**
 * The static pages' foot (blueprint 3.35): a card-fill island with three inline link
 * lines and one data line. Not a column footer; app routes have no footer at all.
 */
export function SiteFoot({ className }: { className?: string }) {
  return (
    <footer className={cn("foot t-row", className)}>
      {LINES.map((line) => (
        <p key={line.lead}>
          <span className="lead">{line.lead}</span>
          {line.links.map(([label, href]) => (
            <span key={href}>
              {" · "}
              <Link href={href}>{label}</Link>
            </span>
          ))}
        </p>
      ))}
      <p className="data t-meta">Data: World Bank, REST Countries, WHO, UNWTO. One shot a day, same board for everyone.</p>
    </footer>
  );
}
