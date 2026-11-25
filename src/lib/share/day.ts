/**
 * The "share your day" text: one line per finished daily, in table order, then the link.
 * The home table and the last daily's result panel build it from the same rows.
 */
export interface DayShareRow {
  title: string;
  score: string;
}

export function buildDayShareText(dateKey: string, rows: readonly DayShareRow[]): string {
  return `Countrivo ${dateKey}\n${rows.map((row) => `${row.title}: ${row.score}`).join("\n")}\nhttps://countrivo.com`;
}
