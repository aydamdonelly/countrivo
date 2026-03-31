"use client";

import { useReducer, useState, useCallback, useMemo, useRef } from "react";
import {
  createBorderBuddies,
  guessCountry,
  giveUp,
  type BorderBuddiesState,
} from "@/lib/game-logic/border-buddies/engine";
import { countries } from "@/lib/data/loader";
import { getDailyRng } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { cn } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";
import { useGameKeys } from "@/hooks/use-game-keys";
import type { Country } from "@/types/country";

interface BorderBoardProps {
  mode: "daily" | "practice";
}

function init(mode: "daily" | "practice"): BorderBuddiesState {
  const rng = mode === "daily" ? getDailyRng(new Date().toISOString().slice(0, 10)) : mulberry32(Date.now());
  return createBorderBuddies(rng);
}

type Action =
  | { type: "GUESS"; iso3: string }
  | { type: "GIVE_UP" }
  | { type: "RESET" };

function reducer(state: BorderBuddiesState, action: Action): BorderBuddiesState {
  switch (action.type) {
    case "GUESS": return guessCountry(state, action.iso3);
    case "GIVE_UP": return giveUp(state);
    case "RESET": return init("practice");
    default: return state;
  }
}

const countryByIso3 = new Map(countries.map((c) => [c.iso3, c]));

export function BorderBoard({ mode }: BorderBoardProps) {
  const [state, dispatch] = useReducer(reducer, mode, init);
  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    if (input.length < 1) return [];
    const query = input.toLowerCase();
    return countries
      .filter(
        (c) =>
          c.displayName.toLowerCase().includes(query) &&
          !state.found.includes(c.iso3) &&
          c.iso3 !== state.country.iso3
      )
      .slice(0, 6);
  }, [input, state.found, state.country.iso3]);

  const handleSelect = useCallback(
    (c: Country) => {
      dispatch({ type: "GUESS", iso3: c.iso3 });
      setInput("");
      setShowDropdown(false);
      inputRef.current?.focus();
    },
    []
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setShowDropdown(e.target.value.length > 0);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && suggestions.length > 0) {
        e.preventDefault();
        handleSelect(suggestions[0]);
      }
    },
    [suggestions, handleSelect]
  );

  if (state.phase === "results") {
    const allFound = state.found.length === state.borders.length;
    return (
      <GameOverScreen
        title={allFound ? "All Borders Found!" : "Border Buddies"}
        score={`${state.found.length} / ${state.borders.length}`}
        subtitle={allFound ? "Perfect!" : "Better luck next time!"}
        onPlayAgain={mode === "practice" ? () => dispatch({ type: "RESET" }) : undefined}
      >
        <div className="w-full max-w-md space-y-2">
          {state.borders.map((iso3) => {
            const c = countryByIso3.get(iso3);
            if (!c) return null;
            const wasFound = state.found.includes(iso3);
            return (
              <div
                key={iso3}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  wasFound
                    ? "border-correct/30 bg-correct/5"
                    : "border-incorrect/30 bg-incorrect/5"
                )}
              >
                <span className="text-2xl">{c.flagEmoji}</span>
                <span className="font-medium flex-1">{c.displayName}</span>
                <span className="text-sm">
                  {wasFound ? "✓" : "✗"}
                </span>
              </div>
            );
          })}
        </div>
      </GameOverScreen>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Target country */}
      <div className="text-center py-6">
        <span className="text-7xl block mb-3">{state.country.flagEmoji}</span>
        <h2 className="text-2xl font-bold">{state.country.displayName}</h2>
        <p className="text-sm text-cream-muted mt-1">
          Name the bordering countries
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-cream-muted">
        <span>
          Found: <span className="font-bold text-cream">{state.found.length}</span> / {state.borders.length}
        </span>
        <span>{state.borders.length - state.found.length} remaining</span>
      </div>

      {/* Input with autocomplete */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => input.length > 0 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder="Type a country name..."
          className="w-full p-4 rounded-xl border-2 border-border bg-surface text-cream placeholder:text-cream-muted focus:border-gold focus:outline-none transition-colors"
        />
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface border-2 border-border rounded-xl shadow-lg z-10 overflow-hidden">
            {suggestions.map((c) => (
              <button
                key={c.iso3}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(c)}
                className="w-full text-left px-4 py-3 hover:bg-surface transition-colors flex items-center gap-3"
              >
                <span className="text-xl">{c.flagEmoji}</span>
                <span className="font-medium">{c.displayName}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Found borders */}
      {state.found.length > 0 && (
        <div className="space-y-2">
          {state.found.map((iso3) => {
            const c = countryByIso3.get(iso3);
            if (!c) return null;
            return (
              <div
                key={iso3}
                className="flex items-center gap-3 p-3 rounded-lg border border-correct/30 bg-correct/5"
              >
                <span className="text-correct">✓</span>
                <span className="text-xl">{c.flagEmoji}</span>
                <span className="font-medium">{c.displayName}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Give Up button */}
      <button
        onClick={() => dispatch({ type: "GIVE_UP" })}
        className="mx-auto px-6 py-3 text-sm text-cream-muted border border-border rounded-xl hover:bg-surface transition-colors"
      >
        Give Up
      </button>
    </div>
  );
}
