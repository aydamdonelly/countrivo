import Link from "next/link";
import { cn, ordinal } from "@/lib/utils";
import { StatIcon } from "@/ui/icons/stat";

export interface StatRow {
  slug: string;
  label: string;
  clarifier?: string;
  /** Formatted; null = no data. */
  value: string | null;
  unit?: string;
  rank: number | null;
}

export interface StatRowsProps {
  rows: readonly StatRow[];
  caption?: string;
  className?: string;
}

/**
 * The 21 country statistics (blueprint 3.34): grid 28 1fr auto 56, StatIcon 20, the label
 * linking to the ranking with its clarifier, the Erode value and unit, the world rank
 * `19th` mute at the right. Missing value: `no data` and no rank.
 */
export function StatRows({ rows, caption, className }: StatRowsProps) {
  return (
    <table className={cn("stat-rows t-row", className)}>
      {caption ? <caption className="sr-only">{caption}</caption> : null}
      <tbody>
        {rows.map((r) => (
          <tr key={r.slug}>
            <td>
              <StatIcon slug={r.slug} size={20} />
            </td>
            <td className="lbl">
              <Link href={`/categories/${r.slug}`}>{r.label}</Link>
              {r.clarifier ? <span className="clar t-meta">{r.clarifier}</span> : null}
            </td>
            <td className="v">
              {r.value === null ? (
                <span className="nodata t-meta">no data</span>
              ) : (
                <>
                  <b className="t-score num">{r.value}</b>
                  {r.unit ? <span className="u t-meta">{r.unit}</span> : null}
                </>
              )}
            </td>
            <td className="wr t-meta num">{r.value !== null && r.rank ? ordinal(r.rank) : ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
