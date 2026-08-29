"use client";

import { allCentroids, centroidFor, type GeoBand } from "@/lib/game-logic/geo-wordle/engine";

export interface MapGuess {
  iso3: string;
  band: GeoBand;
  bearingDeg: number;
  correct: boolean;
}

export interface WorldMapProps {
  guesses: readonly MapGuess[];
  /** The answer, revealed when the game is over: an ember ring and dot. */
  answerIso3?: string | null;
  className?: string;
}

/** Equirectangular: x = lng + 180, y = 84 - lat, lat clipped to 84..-58 (blueprint 3.36). */
function project(lat: number, lng: number): [number, number] {
  return [lng + 180, 84 - Math.max(-58, Math.min(84, lat))];
}

const BACKDROP = allCentroids().map(({ iso3, lat, lng }) => ({ iso3, p: project(lat, lng) }));

/**
 * The GeoWordle mini map: 237 centroids as the backdrop in wait, each guess a dot in its
 * band tone, the latest guess ringed with a needle rotated by its bearing, the answer
 * revealed at the end. Height 142 on phones, 200 on desktop (CSS).
 */
export function WorldMap({ guesses, answerIso3, className }: WorldMapProps) {
  const latest = guesses.length ? guesses[guesses.length - 1] : null;
  const answer = answerIso3 ? centroidFor(answerIso3) : null;
  return (
    <svg className={className ? `wmap ${className}` : "wmap"} viewBox="0 0 360 142" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${guesses.length} guesses on the map`}>
      <g fill="var(--color-wait)">
        {BACKDROP.map((c) => (
          <circle key={c.iso3} cx={c.p[0]} cy={c.p[1]} r="1.35" />
        ))}
      </g>
      {guesses.map((g, i) => {
        const c = centroidFor(g.iso3);
        if (!c) return null;
        const [x, y] = project(c.lat, c.lng);
        const isLatest = latest === g && i === guesses.length - 1;
        return (
          <g key={`${g.iso3}-${i}`}>
            <circle cx={x} cy={y} r={isLatest ? 3.2 : 2.6} className={`dot-${g.band}`} />
            {isLatest && !g.correct ? (
              <g transform={`translate(${x} ${y}) rotate(${g.bearingDeg})`}>
                <circle r="8" fill="none" stroke="var(--color-ink)" strokeWidth="1.5" />
                <path d="M0 -12 L3 -7 L-3 -7 Z" fill="var(--color-ink)" />
              </g>
            ) : null}
          </g>
        );
      })}
      {answer ? (
        <g transform={`translate(${project(answer.lat, answer.lng)[0]} ${project(answer.lat, answer.lng)[1]})`}>
          <circle r="8" fill="none" stroke="var(--color-ember)" strokeWidth="1.5" />
          <circle r="2.6" fill="var(--color-ember)" />
        </g>
      ) : null}
    </svg>
  );
}
