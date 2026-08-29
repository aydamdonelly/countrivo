import Link from "next/link";
import { cn } from "@/lib/utils";
import { Flag } from "@/ui/flag";

export interface RankRow {
  rank: number;
  iso2: string;
  name: string;
  /** `/countries/{slug}`. */
  href: string;
  value: string;
  unit?: string;
  /** The viewer's own country on dynamic pages only. */
  highlight?: boolean;
  /** Continent lists: the capital column. */
  capital?: string;
}

export interface RankTableProps {
  rows: readonly RankRow[];
  /** 4 adds the capital column (continent lists). */
  columns?: 3 | 4;
  caption?: string;
  className?: string;
}

/**
 * A ranking laid out as the board grid (blueprint 3.34): rank mute, Flag xs, the name
 * linking to the country, the Erode value with a mute unit. No pagination, no crowns.
 */
export function RankTable({ rows, columns = 3, caption, className }: RankTableProps) {
  return (
    <table className={cn("rank t-row", columns === 4 && "cols4", className)}>
      {caption ? <caption className="sr-only">{caption}</caption> : null}
      <tbody>
        {rows.map((r) => (
          <tr key={r.iso2} className={r.highlight ? "me" : undefined}>
            <td className="r t-meta num">{r.rank}</td>
            <td>
              <Flag iso2={r.iso2} size="xs" alt="" />
            </td>
            <td className="nm">
              <Link href={r.href}>{r.name}</Link>
            </td>
            {columns === 4 ? <td className="cap t-meta">{r.capital ?? "no capital"}</td> : null}
            <td className="v">
              <b className="t-score num">{r.value}</b>
              {r.unit ? <span className="u t-meta">{r.unit}</span> : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
