/**
 * Speed Flags share line (concept 5.8). Practice only, so no date and no grid:
 *
 *   Countrivo Speed Flags practice: 21 in 30 seconds
 *   https://countrivo.com/games/speed-flags
 *
 * The link sits alone on the last line like every other share, so it auto-links.
 */
import { gameShareUrl } from "./share-utils";

/** Mirrors the engine's DURATION_MS; share builders import nothing from game logic. */
const SECONDS = 30;

export function buildSpeedFlagsShare(correct: number): string {
  return [`Countrivo Speed Flags practice: ${correct} in ${SECONDS} seconds`, gameShareUrl("speed-flags")].join("\n");
}
