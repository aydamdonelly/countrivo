import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TableColumn {
  key: string;
  label: string;
  /** Right-aligned Erode value cells. */
  value?: boolean;
}

export interface TableProps {
  columns: readonly TableColumn[];
  rows: readonly Record<string, ReactNode>[];
  rowKey?: (row: Record<string, ReactNode>, index: number) => string;
  caption?: string;
  className?: string;
}

/**
 * A plain table (blueprint 3.34): 14 px rows, padding 10 0, 1 px lines, mute 500
 * headers, value cells in Erode right-aligned. Wide tables scroll inside the wrapper.
 */
export function Table({ columns, rows, rowKey, caption, className }: TableProps) {
  return (
    <div className={cn("tbl-wrap", className)}>
      <table className="tbl t-row">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cn("t-meta", c.value && "v")}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={rowKey ? rowKey(row, i) : i}>
              {columns.map((c) => (
                <td key={c.key} className={c.value ? "v t-score num" : undefined}>
                  {row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
