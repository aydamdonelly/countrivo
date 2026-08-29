import type { RunDetailProps } from "@/games/types";
import { kmLabel } from "./module";

interface StoredGuess {
  distanceKm?: unknown;
  correct?: unknown;
}

const MAX_GUESSES = 6;

/**
 * The run rows for a shared GeoWordle run (blueprint 7.7), in the generic label / Erode
 * value language. The guessed countries and the answer are never printed: a run link is
 * public, and today's board is still open for everyone else.
 */
export function RunDetail({ run }: RunDetailProps) {
  const json = run.resultJson ?? {};
  const guesses: StoredGuess[] = Array.isArray(json.guesses) ? (json.guesses as StoredGuess[]) : [];
  if (guesses.length === 0) return null;
  const won = json.won === true;
  const distances = guesses
    .map((g) => (typeof g.distanceKm === "number" ? g.distanceKm : Number.NaN))
    .filter((n) => Number.isFinite(n) && n > 0);
  const rows: { label: string; value: string }[] = [
    { label: "guesses", value: String(won ? guesses.length : MAX_GUESSES) },
  ];
  if (!won && distances.length > 0) rows.push({ label: "closest", value: kmLabel(Math.min(...distances)) });
  return (
    <div className="rrows t-row">
      {rows.map((r) => (
        <div key={r.label} className="rrow" style={{ gridTemplateColumns: "1fr auto" }}>
          <span className="nm">{r.label}</span>
          <b className="v t-score num">{r.value}</b>
        </div>
      ))}
    </div>
  );
}
