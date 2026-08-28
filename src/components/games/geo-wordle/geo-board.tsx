"use client";
import { CountryFlag } from "@/components/ui/country-flag";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createGeoWordle,
  submitGuess,
  resolveGuess,
  guessableCountries,
  guessesUsed,
  answerCountry,
  allCentroids,
  centroidFor,
  MAX_GUESSES,
  type GeoWordleState,
  type GeoGuess,
  type GeoBand,
} from "@/lib/game-logic/geo-wordle/engine";
import { getDailyRng, getTodayDateKey } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { cn } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";
import { GameSessionTopBar } from "@/components/game/game-session-top-bar";
import { useGameKeys } from "@/hooks/use-game-keys";
import { juice } from "@/hooks/use-juice";
import { useAuth } from "@/components/auth/auth-provider";
import { submitGameRun } from "@/app/actions/game-runs";
import { setDailyLockout, dailyProgressKey } from "@/lib/storage";
import { useDailyProgress } from "@/hooks/use-daily-progress";
import type { Country } from "@/types/country";
import type { ServerGameRun } from "@/types/server";

interface GeoBoardProps {
  mode: "daily" | "practice";
  edition: string;
}

function init(mode: "daily" | "practice", edition: string): GeoWordleState {
  const rng = mode === "daily" ? getDailyRng(getTodayDateKey(), edition) : mulberry32(Date.now());
  return createGeoWordle(rng);
}

type Action = { type: "GUESS"; country: Country } | { type: "RESET" };

function reducer(state: GeoWordleState, action: Action): GeoWordleState {
  switch (action.type) {
    case "GUESS":
      return submitGuess(state, action.country);
    case "RESET":
      return init("practice", "");
    default:
      return state;
  }
}

/**
 * Band presentation. Colours come from the `--color-geo-*` ramp in globals.css
 * (light + dark twins) and are applied inline as `var(...)` — the same pattern
 * game-colors.ts uses — so they flip with the theme.
 */
const BAND_STYLE: Record<GeoBand, { color: string; label: string }> = {
  hit: { color: "var(--color-correct)", label: "Solved" },
  burning: { color: "var(--color-geo-burning)", label: "Burning" },
  hot: { color: "var(--color-geo-hot)", label: "Hot" },
  warm: { color: "var(--color-geo-warm)", label: "Warm" },
  cool: { color: "var(--color-geo-cool)", label: "Cool" },
  cold: { color: "var(--color-geo-cold)", label: "Cold" },
};

/**
 * Guesses persisted before the band/direction fields existed still deserialise
 * into state, so never index the ramp blind.
 */
function bandStyle(band: GeoBand | undefined) {
  return (band && BAND_STYLE[band]) || BAND_STYLE.cold;
}

const EMPTY_KEYS: Record<string, () => void> = {};

/* ---------- Direction needle ---------- */

/**
 * A real arrow rotated to the exact bearing, replacing the old 8-way emoji.
 * Emoji arrows rendered at wildly different weights per platform — several of
 * the diagonals fall back to thin text glyphs — and quantising to 45° threw
 * away precision the engine already had.
 */
function Needle({ bearingDeg, size = 20, color }: { bearingDeg: number; size?: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      style={{ transform: `rotate(${bearingDeg}deg)` }}
      className="shrink-0 transition-transform duration-500 ease-[var(--ease-game)]"
    >
      <path d="M12 2.5 L18.5 19 L12 15 L5.5 19 Z" fill={color} />
    </svg>
  );
}

/* ---------- Mini world map ---------- */

const MAP_W = 360;
// Cropped equirectangular: a full -90..90 frame spends a third of its height on
// empty ocean and Antarctica, which shrinks the inhabited world to a smear.
const LAT_MAX = 84;
const LAT_MIN = -58;
const MAP_H = LAT_MAX - LAT_MIN;

function projectX(lng: number): number {
  return lng + 180;
}
function projectY(lat: number): number {
  return LAT_MAX - lat;
}
function inFrame(lat: number): boolean {
  return lat <= LAT_MAX && lat >= LAT_MIN;
}

/** The site renders in English everywhere — never inherit the browser locale. */
function km(distanceKm: number): string {
  return distanceKm.toLocaleString("en-US");
}

/**
 * Equirectangular mini map. The backdrop is every country centroid at low
 * opacity — 237 points read as the continents themselves, so this needs no
 * polygon data in the bundle. The answer is never plotted, only guesses.
 */
function WorldMap({ guesses, revealIso3 }: { guesses: GeoGuess[]; revealIso3?: string }) {
  const reveal = revealIso3 ? centroidFor(revealIso3) : null;
  const backdrop = useMemo(() => allCentroids().filter((p) => inFrame(p.lat)), []);
  const plotted = useMemo(
    () =>
      guesses
        .map((g) => {
          const c = centroidFor(g.iso3);
          return c ? { guess: g, ...c } : null;
        })
        .filter((p): p is { guess: GeoGuess; lat: number; lng: number } => p !== null),
    [guesses],
  );
  const latest = plotted.length > 0 ? plotted[plotted.length - 1] : null;

  const label =
    plotted.length === 0
      ? "World map. No guesses plotted yet."
      : `World map showing ${plotted.length} guessed ${plotted.length === 1 ? "country" : "countries"}.`;

  return (
    <div className="rounded-2xl border border-border bg-surface-sunken overflow-hidden">
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="w-full h-auto block"
        role="img"
        aria-label={label}
      >
        {/* Group opacity, not per-circle: dense archipelagos (the Caribbean, the
            Pacific) stack dozens of translucent dots into a near-white smudge
            when each one fades independently. One composite pass fixes it. */}
        <g className="fill-cream" opacity={0.32}>
          {backdrop.map((p) => (
            <circle key={p.iso3} cx={projectX(p.lng)} cy={projectY(p.lat)} r={1.35} />
          ))}
        </g>

        {plotted.map(({ guess, lat, lng }) => {
          const { color } = bandStyle(guess.band);
          const isLatest = latest !== null && guess.iso3 === latest.guess.iso3;
          return (
            <g key={guess.iso3}>
              {isLatest && (
                <circle
                  cx={projectX(lng)}
                  cy={projectY(lat)}
                  r={8}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.2}
                  opacity={0.55}
                />
              )}
              <circle cx={projectX(lng)} cy={projectY(lat)} r={isLatest ? 4.2 : 3} fill={color} />
            </g>
          );
        })}

        {/* Revealed only once the round is over — the payoff shot. */}
        {reveal && (
          <g>
            <circle
              cx={projectX(reveal.lng)}
              cy={projectY(reveal.lat)}
              r={7}
              fill="none"
              className="stroke-correct"
              strokeWidth={1.6}
            />
            <circle
              cx={projectX(reveal.lng)}
              cy={projectY(reveal.lat)}
              r={3.4}
              className="fill-correct"
            />
          </g>
        )}

        {/* Heading out of the newest guess — the "go this way" cue. */}
        {latest && !latest.guess.correct && !reveal && (
          <g
            transform={`translate(${projectX(latest.lng)} ${projectY(latest.lat)}) rotate(${latest.guess.bearingDeg})`}
          >
            <path
              d="M0 -11 L3.4 -3.2 L0 -5.1 L-3.4 -3.2 Z"
              fill={bandStyle(latest.guess.band).color}
            />
          </g>
        )}
      </svg>
    </div>
  );
}

/* ---------- Guess row ---------- */

function GuessRow({ g, index }: { g: GeoGuess; index: number }) {
  const { color, label } = bandStyle(g.band);
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-surface">
      <span className="text-2xl shrink-0" aria-hidden>
        <CountryFlag iso2={g.iso2} width={28} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-medium text-sm truncate">{g.name}</span>
          <span className="font-mono text-xs font-bold shrink-0 tabular-nums" style={{ color }}>
            {g.correct ? label : `${km(g.distanceKm)} km`}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-cream-ghost overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-[var(--ease-game)]"
              style={{ width: `${Math.max(g.proximityPct, 3)}%`, backgroundColor: color }}
            />
          </div>
          <span
            className="text-[0.65rem] font-bold uppercase tracking-wide shrink-0"
            style={{ color }}
          >
            {label}
          </span>
        </div>
      </div>
      {g.correct ? (
        <span className="text-xl shrink-0" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="inline-block"><path d="M5 12l5 5 9-10" /></svg>
        </span>
      ) : (
        <Needle bearingDeg={g.bearingDeg} color={color} />
      )}
      <span className="sr-only">
        {g.correct
          ? `Guess ${index + 1}: ${g.name}. Correct.`
          : `Guess ${index + 1}: ${g.name}. ${km(g.distanceKm)} kilometres away, ${g.direction || "unknown direction"}. ${label}.`}
      </span>
    </div>
  );
}

function EmptyRow({ index }: { index: number }) {
  return (
    <div
      className="flex items-center h-[3.25rem] px-3 rounded-xl border border-dashed border-border"
      aria-hidden
    >
      <span className="font-mono text-xs text-cream-dim tabular-nums">{index + 1}</span>
    </div>
  );
}

export function GeoBoard({ mode, edition }: GeoBoardProps) {
  const { state, dispatch, startedAtRef } = useDailyProgress(reducer, () => init(mode, edition), {
    storageKey: dailyProgressKey("geo-wordle", getTodayDateKey(), edition),
    enabled: mode === "daily",
  });
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [serverData, setServerData] = useState<ServerGameRun | null>(null);
  const [pendingPayload, setPendingPayload] = useState<Parameters<typeof submitGameRun>[0] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submittedRef = useRef(false);
  const { user, openAuthModal } = useAuth();

  const finished = state.phase !== "playing";
  const guessedIso3 = useMemo(() => new Set(state.guesses.map((g) => g.iso3)), [state.guesses]);

  const suggestions = useMemo(() => {
    if (!inputValue.trim() || finished) return [];
    const needle = inputValue.trim().toLowerCase();
    return guessableCountries()
      .filter(
        (c) =>
          !guessedIso3.has(c.iso3) &&
          (c.name.toLowerCase().includes(needle) || c.displayName.toLowerCase().includes(needle)),
      )
      .slice(0, 5);
  }, [inputValue, guessedIso3, finished]);

  const submit = useCallback(
    (name: string) => {
      if (finished || !name.trim()) return;
      const country = resolveGuess(name);
      if (!country) {
        setError("Not a country");
        juice.wrong();
        return;
      }
      if (guessedIso3.has(country.iso3)) {
        setError("Already guessed");
        juice.wrong();
        return;
      }
      const next = submitGuess(state, country);
      const newGuess = next.guesses[next.guesses.length - 1];
      if (newGuess?.correct) juice.correct();
      else if (next.phase === "lost") juice.wrong();
      else juice.select();
      dispatch({ type: "GUESS", country });
      setInputValue("");
      setShowSuggestions(false);
    },
    [finished, state, guessedIso3, dispatch],
  );

  // Focus the input on mount and after each guess.
  useEffect(() => {
    if (!finished) inputRef.current?.focus();
  }, [state.guesses.length, finished]);

  // Auto-clear the inline error.
  useEffect(() => {
    if (!error) return;
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(null), 2000);
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, [error]);

  // Win flourish.
  useEffect(() => {
    if (state.phase === "won") juice.celebrate();
  }, [state.phase]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const open = showSuggestions && suggestions.length > 0;
      switch (e.key) {
        case "ArrowDown":
          if (!open) return;
          e.preventDefault();
          setActiveIndex((i) => (i + 1) % suggestions.length);
          return;
        case "ArrowUp":
          if (!open) return;
          e.preventDefault();
          setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
          return;
        case "Enter":
          e.preventDefault();
          // A highlighted suggestion wins over the raw text, so a partial like
          // "united k" submits United Kingdom instead of failing to resolve.
          submit(open && activeIndex >= 0 ? suggestions[activeIndex].displayName : inputValue);
          return;
        case "Tab":
          if (!open) return;
          e.preventDefault();
          setInputValue(suggestions[Math.max(activeIndex, 0)].displayName);
          setShowSuggestions(false);
          return;
        case "Escape":
          setShowSuggestions(false);
          return;
        default:
      }
    },
    [inputValue, suggestions, submit, showSuggestions, activeIndex],
  );

  useGameKeys(EMPTY_KEYS, !finished);

  // Submit the run once when the game ends. submittedRef keeps it idempotent
  // (no double-submit on an auth-state change mid-results).
  useEffect(() => {
    if (state.phase === "playing" || submittedRef.current) return;
    submittedRef.current = true;
    const used = guessesUsed(state);
    const won = state.phase === "won";
    const scoreDisplay = won ? `${used}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
    if (mode === "daily") {
      setDailyLockout(
        "geo-wordle",
        getTodayDateKey(),
        { score: String(used), scoreDisplay, timestamp: Date.now() },
        edition,
      );
    }
    const payload = {
      gameSlug: "geo-wordle",
      mode,
      dateKey: getTodayDateKey(),
      scoreRaw: used,
      scoreMax: MAX_GUESSES,
      scoreSortValue: MAX_GUESSES - used,
      scoreDisplay,
      resultJson: {
        answerIso3: state.answerIso3,
        won,
        guesses: state.guesses.map((g) => ({
          iso3: g.iso3,
          distanceKm: g.distanceKm,
          proximityPct: g.proximityPct,
          arrow: g.arrow,
          band: g.band,
          correct: g.correct,
        })),
      },
      startedAt: startedAtRef.current,
    };
    if (user) {
      submitGameRun(payload).then((res) => {
        if (res.success && res.run) setServerData(res.run);
      });
    } else {
      setPendingPayload(payload);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  if (finished) {
    const used = guessesUsed(state);
    const won = state.phase === "won";
    const answer = answerCountry(state);
    const handleSaveScore = pendingPayload
      ? () => {
          openAuthModal(async () => {
            const res = await submitGameRun(pendingPayload);
            if (res.success && res.run) setServerData(res.run);
            setPendingPayload(null);
          });
        }
      : undefined;

    return (
      <GameOverScreen
        title={won ? `Solved in ${used}/${MAX_GUESSES}` : "Out of guesses"}
        score={won ? `${used}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`}
        subtitle={
          won
            ? used === 1
              ? "Incredible — first try."
              : used <= 3
                ? "Sharp geography."
                : "Got there."
            : answer
              ? `It was ${answer.displayName}`
              : "Better luck tomorrow."
        }
        onPlayAgain={
          mode === "practice"
            ? () => {
                submittedRef.current = false;
                setServerData(null);
                setPendingPayload(null);
                dispatch({ type: "RESET" });
              }
            : undefined
        }
        onSaveScore={handleSaveScore}
        numericScore={MAX_GUESSES - used}
        maxScore={MAX_GUESSES}
        gameSlug="geo-wordle"
        shareData={{
          game: "geo-wordle",
          result: {
            won,
            guesses: state.guesses.map((g) => ({
              band: g.band,
              arrow: g.arrow,
              correct: g.correct,
            })),
          },
          dateKey: getTodayDateKey(),
        }}
        serverData={
          serverData
            ? {
                rankToday: serverData.rankDaily,
                percentile: serverData.percentile,
                totalPlayersToday: 0,
                isPersonalBest: serverData.isPersonalBest,
                runId: serverData.id,
                dailyDate: serverData.dailyDate ?? undefined,
              }
            : undefined
        }
      >
        <div className="w-full max-w-md space-y-3">
          <WorldMap guesses={state.guesses} revealIso3={answer?.iso3} />
          <div className="space-y-2">
            {state.guesses.map((g, i) => (
              <GuessRow key={g.iso3} g={g} index={i} />
            ))}
            {!won && answer && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-correct/40 bg-correct/5">
                <span className="text-2xl" aria-hidden>
                  <CountryFlag iso2={answer.iso2} width={28} />
                </span>
                <span className="font-bold text-sm">{answer.displayName}</span>
                <span className="ml-auto text-xs font-bold text-correct uppercase tracking-wide">
                  Answer
                </span>
              </div>
            )}
          </div>
        </div>
      </GameOverScreen>
    );
  }

  const remaining = MAX_GUESSES - state.guesses.length;
  const latest = state.guesses.length > 0 ? state.guesses[state.guesses.length - 1] : null;

  return (
    <div className="flex flex-col gap-5">
      <GameSessionTopBar
        mode={mode}
        scoreLabel="Guess"
        scoreValue={`${state.guesses.length + 1}`}
        progressCurrent={state.guesses.length}
        progressTotal={MAX_GUESSES}
      />

      <div className="w-full max-w-md mx-auto space-y-3">
        <WorldMap guesses={state.guesses} />

        {/* One plain-language readout of the newest guess — the whole hint in a line. */}
        <p className="text-center text-sm min-h-[1.25rem]" aria-live="polite">
          {latest ? (
            <>
              <span className="text-cream-muted">
                <CountryFlag iso2={latest.iso2} width={20} className="mr-1.5 align-[-3px]" />{latest.name} is{" "}
              </span>
              <span className="font-bold tabular-nums" style={{ color: bandStyle(latest.band).color }}>
                {km(latest.distanceKm)} km
              </span>
              <span className="text-cream-muted"> {latest.direction} of the answer</span>
            </>
          ) : (
            <span className="text-cream-muted">
              Guess any country — you will get the distance and direction to the answer.
            </span>
          )}
        </p>
      </div>

      {/* Guess rows + empty slots — reads like a 6-row Wordle board */}
      <div className="w-full max-w-md mx-auto space-y-2">
        {state.guesses.map((g, i) => (
          <GuessRow key={g.iso3} g={g} index={i} />
        ))}
        {Array.from({ length: remaining }).map((_, i) => (
          <EmptyRow key={`empty-${i}`} index={state.guesses.length + i} />
        ))}
      </div>

      {/* Input + autocomplete */}
      <div className="relative max-w-md mx-auto w-full">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
            setActiveIndex(0);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder="Type a country..."
          aria-label="Guess a country"
          role="combobox"
          aria-expanded={showSuggestions && suggestions.length > 0}
          aria-controls="geo-suggestions"
          aria-autocomplete="list"
          aria-activedescendant={
            showSuggestions && suggestions.length > 0 ? `geo-suggestion-${activeIndex}` : undefined
          }
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className={cn(
            "w-full px-4 py-3 rounded-xl border-2 bg-surface text-cream text-lg",
            "placeholder:text-cream-muted/50 focus:outline-none focus:border-gold transition-colors",
            error ? "border-incorrect" : "border-border",
          )}
        />
        {error && (
          <div className="absolute -bottom-6 left-0 right-0 text-center">
            <span className="text-sm text-incorrect font-medium">{error}</span>
          </div>
        )}
        {showSuggestions && suggestions.length > 0 && (
          <div
            id="geo-suggestions"
            role="listbox"
            className="absolute bottom-full mb-1 left-0 right-0 bg-surface border-2 border-border rounded-xl overflow-hidden z-10 shadow-lg"
          >
            {suggestions.map((c, i) => (
              <button
                key={c.iso3}
                id={`geo-suggestion-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  submit(c.displayName);
                }}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-2 text-left transition-colors min-h-[44px]",
                  i === activeIndex ? "bg-gold-dim" : "hover:bg-gold-dim",
                )}
              >
                <span className="text-xl" aria-hidden>
                  <CountryFlag iso2={c.iso2} width={28} />
                </span>
                <span className="font-medium text-cream">{c.displayName}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
