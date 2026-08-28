"use client";
import { CountryFlag } from "@/components/ui/country-flag";

import {
  useReducer,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import {
  createBorderline,
  makeMove,
  getValidNeighbors,
  type BorderlineState,
} from "@/lib/game-logic/borderline/engine";
import { getDailyRng } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { cn } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";
import { useGameKeys } from "@/hooks/use-game-keys";
import { juice } from "@/hooks/use-juice";

/* ── Props ─────────────────────────────────────────────────────────── */

interface BorderlineBoardProps {
  /** Server-supplied seed for the first practice board, so SSR and hydration agree. */
  practiceSeed?: number;
  mode: "practice";
  dailyKey?: string | null;
}

/* ── Reducer ───────────────────────────────────────────────────────── */

type Action =
  | { type: "MOVE"; name: string }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "RESET"; mode: "practice" | "daily" };

interface ReducerState {
  game: BorderlineState;
  error: string | null;
}

function initState(args: {
  mode: string;
  dailyKey?: string | null;
  seed?: number;
}): ReducerState {
  const rng =
    args.mode === "daily" && args.dailyKey
      ? getDailyRng(args.dailyKey)
      : mulberry32(args.seed ?? Date.now());
  return { game: createBorderline(rng), error: null };
}

function reducer(state: ReducerState, action: Action): ReducerState {
  switch (action.type) {
    case "MOVE": {
      const result = makeMove(state.game, action.name);
      return { game: result.state, error: result.error };
    }
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "RESET":
      return initState({ mode: action.mode });
    default:
      return state;
  }
}

/* ── Board ─────────────────────────────────────────────────────────── */

export function BorderlineBoard({
  mode,
  dailyKey,
  practiceSeed,
}: BorderlineBoardProps) {
  const [state, dispatch] = useReducer(
    reducer,
    { mode: dailyKey ? "daily" : mode, dailyKey, seed: practiceSeed },
    initState,
  );

  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { game, error } = state;

  /* ── Auto-focus input ──────────────────────────────────────────── */

  useEffect(() => {
    if (game.phase === "playing") {
      inputRef.current?.focus();
    }
  }, [game.phase, game.moveCount]);

  /* ── Auto-clear error ──────────────────────────────────────────── */

  useEffect(() => {
    if (error) {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => {
        dispatch({ type: "SET_ERROR", error: null });
      }, 2000);
      return () => {
        if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      };
    }
  }, [error]);

  /* ── Completion flourish ───────────────────────────────────────── */

  useEffect(() => {
    if (game.phase === "finished") juice.celebrate();
  }, [game.phase]);

  /* ── Compute autocomplete suggestions ──────────────────────────── */

  const suggestions = useMemo(() => {
    if (!inputValue.trim() || game.phase !== "playing") return [];
    const neighbors = getValidNeighbors(game.currentCountry.iso3);
    const needle = inputValue.trim().toLowerCase();
    const visitedIso3 = new Set(game.path.map((c) => c.iso3));
    return neighbors
      .filter(
        (c) =>
          !visitedIso3.has(c.iso3) &&
          (c.name.toLowerCase().includes(needle) ||
            c.displayName.toLowerCase().includes(needle)),
      )
      .slice(0, 5);
  }, [inputValue, game.currentCountry.iso3, game.path, game.phase]);

  /* ── Submit move ───────────────────────────────────────────────── */

  const submitMove = useCallback(
    (name: string) => {
      if (game.phase !== "playing" || !name.trim()) return;

      // Determine the verdict (pure check) so haptic + sound land with the
      // visual update: a valid step advances the path, an invalid one errors.
      const { state: nextGame, error: moveError } = makeMove(game, name);
      if (moveError) juice.wrong();
      else if (nextGame.phase === "finished") juice.correct();
      else juice.select();

      dispatch({ type: "MOVE", name });
      setInputValue("");
      setShowSuggestions(false);
    },
    [game],
  );

  /* ── Keyboard handling ─────────────────────────────────────────── */

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitMove(inputValue);
      } else if (e.key === "Tab") {
        e.preventDefault();
        if (suggestions.length > 0) {
          setInputValue(suggestions[0].displayName);
          setShowSuggestions(false);
        }
      }
    },
    [inputValue, suggestions, submitMove],
  );

  /* useGameKeys for Enter (when input is not focused, as a fallback) */
  const keymap = useMemo(() => {
    const map: Record<string, () => void> = {};
    return map;
  }, []);

  useGameKeys(keymap, game.phase === "playing");

  /* ── Results screen ─────────────────────────────────────────────── */

  if (game.phase === "finished") {
    const diff = game.moveCount - game.optimalLength;
    const perfect = diff === 0;
    const title = perfect ? "Perfect!" : game.won ? "You Made It!" : "Finished";
    const scoreText = `${game.moveCount} steps`;
    const subtitle = `Optimal path: ${game.optimalLength} steps${diff > 0 ? ` (you took ${diff} extra)` : ""}`;

    return (
      <GameOverScreen
        title={title}
        score={scoreText}
        subtitle={subtitle}
        onPlayAgain={
          mode === "practice"
            ? () => dispatch({ type: "RESET", mode: "practice" })
            : undefined
        }
        numericScore={game.optimalLength}
        maxScore={game.moveCount}
        gameSlug="borderline"
      >
        {/* Path summary */}
        <div className="w-full max-w-md space-y-2">
          {game.path.map((c, i) => (
            <div
              key={c.iso3}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg border text-sm",
                i === 0 && "border-gold/30 bg-gold-dim",
                i === game.path.length - 1 &&
                  i !== 0 &&
                  "border-correct/30 bg-correct/5",
                i > 0 &&
                  i < game.path.length - 1 &&
                  "border-border bg-surface",
              )}
            >
              <CountryFlag iso2={c.iso2} width={26} />
              <span className="font-medium">{c.displayName}</span>
              {i === 0 && (
                <span className="ml-auto text-xs text-gold font-bold uppercase">
                  Start
                </span>
              )}
              {i === game.path.length - 1 && i !== 0 && (
                <span className="ml-auto text-xs text-correct font-bold uppercase">
                  Goal
                </span>
              )}
            </div>
          ))}
        </div>
      </GameOverScreen>
    );
  }

  /* ── Available neighbors (for display) ─────────────────────────── */

  const allNeighbors = getValidNeighbors(game.currentCountry.iso3);
  const visitedIso3Set = new Set(game.path.map((c) => c.iso3));
  const availableNeighbors = allNeighbors.filter(
    (c) => !visitedIso3Set.has(c.iso3),
  );

  /* ── Game UI ─────────────────────────────────────────────────────── */

  return (
    <div className="flex flex-col gap-6">
      {/* Header: Start -> Target */}
      <div className="flex items-center justify-center gap-4 py-4 px-4 rounded-xl border-2 border-border bg-surface">
        <div className="flex items-center gap-2 text-center">
          <span className="text-3xl sm:text-4xl">
            <CountryFlag iso2={game.startCountry.iso2} width={28} />
          </span>
          <span className="font-bold text-sm sm:text-base">
            {game.startCountry.displayName}
          </span>
        </div>
        <span className="text-cream-muted text-xl font-bold px-2">&rarr;</span>
        <div className="flex items-center gap-2 text-center">
          <span className="text-3xl sm:text-4xl">
            <CountryFlag iso2={game.targetCountry.iso2} width={28} />
          </span>
          <span className="font-bold text-sm sm:text-base">
            {game.targetCountry.displayName}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-cream-muted uppercase tracking-wide font-medium">
          Steps: <span className="text-gold font-bold">{game.moveCount}</span>
          <span className="text-cream-muted">
            {" "}
            / Optimal: {game.optimalLength}
          </span>
        </span>
      </div>

      {/* Current country (prominent) */}
      <div className="flex flex-col items-center py-6">
        <span className="text-7xl sm:text-8xl mb-3">
          <CountryFlag iso2={game.currentCountry.iso2} width={28} />
        </span>
        <span className="font-bold text-2xl sm:text-3xl">
          {game.currentCountry.displayName}
        </span>
        <span className="text-sm text-cream-muted mt-1 uppercase tracking-wide">
          Current location
        </span>
      </div>

      {/* Input area */}
      <div className="relative max-w-md mx-auto w-full">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            /* Delay to allow clicking suggestions */
            setTimeout(() => setShowSuggestions(false), 150);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a bordering country..."
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className={cn(
            "w-full px-4 py-3 rounded-xl border-2 bg-surface text-cream text-lg",
            "placeholder:text-cream-muted/50 focus:outline-none focus:border-cream",
            "transition-colors",
            error ? "border-incorrect" : "border-border",
          )}
        />

        {/* Error message */}
        {error && (
          <div className="absolute -bottom-7 left-0 right-0 text-center">
            <span className="text-sm text-incorrect font-medium">{error}</span>
          </div>
        )}

        {/* Autocomplete dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-surface border-2 border-border rounded-xl overflow-hidden z-10">
            {suggestions.map((c) => (
              <button
                key={c.iso3}
                onMouseDown={(e) => {
                  e.preventDefault();
                  submitMove(c.displayName);
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-gold-dim transition-colors min-h-[44px]"
              >
                <CountryFlag iso2={c.iso2} width={26} />
                <span className="font-medium text-cream">
                  {c.displayName}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Path display (vertical chain) */}
      <div className="mt-4">
        <p className="text-sm text-cream-muted font-medium mb-3 text-center">
          Your path
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {game.path.map((c, i) => (
            <div key={c.iso3} className="flex items-center gap-1">
              {i > 0 && (
                <span className="text-cream-muted text-xs font-bold mr-1">
                  &rarr;
                </span>
              )}
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm",
                  i === 0 && "border-gold/30 bg-gold-dim",
                  i === game.path.length - 1 &&
                    i !== 0 &&
                    "border-border bg-surface",
                  i > 0 &&
                    i < game.path.length - 1 &&
                    "border-border bg-surface opacity-70",
                )}
              >
                <CountryFlag iso2={c.iso2} width={24} />
                <span className="font-medium">{c.displayName}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available neighbors hint */}
      <div className="mt-2">
        <p className="text-xs text-cream-muted font-medium mb-2 text-center">
          Neighbors ({availableNeighbors.length})
        </p>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {availableNeighbors.map((c) => (
            <button
              key={c.iso3}
              onClick={() => submitMove(c.displayName)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-surface hover:border-cream/50 hover:bg-gold-dim transition-all text-sm"
            >
              <CountryFlag iso2={c.iso2} width={22} />
              <span className="font-medium text-cream-muted">
                {c.displayName}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
