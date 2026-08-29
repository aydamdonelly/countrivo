import type { RunDetailProps } from "@/games/types";
import { kmLabel } from "./module";

interface StoredGuess {
  distanceKm?: unknown;
  correct?: unknown;
}

const MAX_GUESSES = 6;

/**
 * The run rows for a shared GeoWordle run (blueprint 7.7), in the house label / Erode value
 * language. The guessed countries and the answer are never printed: a run link is public and
 * today's board is still open for everyone else, so the page says how the run went and
 * nothing that would solve it.
 */
export function RunDetail({ run }: RunDetailProps) {
  const json = run.resultJson ?? {};
  const guesses: StoredGuess[] = Array.isArray(json.guesses) ? (json.guesses as StoredGuess[]) : [];
  if (guesses.length === 0) return null;
  const won = json.won === true;
  const used = won ? guesses.length : MAX_GUESSES;
  const misses = guesses
    .filter((g) => g.correct !== true)
    .map((g) => (typeof g.distanceKm === "number" ? g.distanceKm : Number.NaN))
    .filter((n) => Number.isFinite(n) && n > 0);
  return (
    <div>
      <div className="rhead">
        <b className="t-h3">{won ? "Solved." : "Not found."}</b>
        <span className="rfacts t-body">
          <b className="num">{used}</b> of {MAX_GUESSES} guesses
        </span>
      </div>
      {misses.length > 0 ? (
        <div className="rrows t-row">
          <div className="rrow">
            <span />
            <span className="nm">{won ? "closest miss" : "closest guess"}</span>
            <b className="v t-score num">{kmLabel(Math.min(...misses))}</b>
          </div>
        </div>
      ) : null}
    </div>
  );
}
