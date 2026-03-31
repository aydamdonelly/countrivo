"use client";

import { useReducer, useCallback } from "react";
import {
  createSortGame,
  moveItem,
  submitSort,
  type SortGameState,
} from "@/lib/game-logic/population-sort/engine";
import { getDailyRng } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { cn, formatStat } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";
import statsData from "@/data/stats.json";

const stats: Record<string, Record<string, number | null>> = statsData;

interface SortBoardProps {
  mode: "daily" | "practice";
}

function init(mode: "daily" | "practice"): SortGameState {
  const rng = mode === "daily" ? getDailyRng(new Date().toISOString().slice(0, 10)) : mulberry32(Date.now());
  return createSortGame(rng);
}

type Action =
  | { type: "MOVE"; from: number; to: number }
  | { type: "SUBMIT" }
  | { type: "RESET" };

function reducer(state: SortGameState, action: Action): SortGameState {
  switch (action.type) {
    case "MOVE": return moveItem(state, action.from, action.to);
    case "SUBMIT": return submitSort(state);
    case "RESET": return init("practice");
    default: return state;
  }
}

export function SortBoard({ mode }: SortBoardProps) {
  const [state, dispatch] = useReducer(reducer, mode, init);

  const handleMoveUp = useCallback((idx: number) => {
    if (idx > 0) dispatch({ type: "MOVE", from: idx, to: idx - 1 });
  }, []);

  const handleMoveDown = useCallback((idx: number) => {
    if (idx < state.userOrder.length - 1) dispatch({ type: "MOVE", from: idx, to: idx + 1 });
  }, [state.userOrder.length]);

  if (state.phase === "results") {
    return (
      <div className="flex flex-col gap-6">
        <GameOverScreen
          title="Sort Complete!"
          score={`${state.score} / ${state.countries.length}`}
          subtitle={`Sorted by ${state.category.label}`}
          onPlayAgain={mode === "practice" ? () => dispatch({ type: "RESET" }) : undefined}
        >
          <div className="w-full max-w-xl space-y-3">
            {state.correctOrder.map((countryIdx, rank) => {
              const country = state.countries[countryIdx];
              const userRank = state.userOrder.indexOf(countryIdx);
              const isCorrect = userRank === rank;
              const value = stats[country.iso3]?.[state.category.slug];

              return (
                <div
                  key={country.iso3}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-2",
                    isCorrect ? "border-correct/30 bg-correct/5" : "border-incorrect/30 bg-incorrect/5"
                  )}
                >
                  <span className="w-10 h-10 rounded-full bg-surface flex items-center justify-center font-bold text-lg shrink-0">
                    {rank + 1}
                  </span>
                  <span className="text-3xl">{country.flagEmoji}</span>
                  <span className="font-bold text-lg flex-1">{country.displayName}</span>
                  <span className="text-base font-mono text-cream-muted">
                    {value ? formatStat(value, state.category.unit) : "N/A"}
                  </span>
                </div>
              );
            })}
          </div>
        </GameOverScreen>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <p className="text-lg text-cream-muted">
          Sort by <span className="font-bold text-cream text-xl">{state.category.emoji} {state.category.label}</span> — highest first
        </p>
      </div>

      <div className="space-y-3">
        {state.userOrder.map((countryIdx, position) => {
          const country = state.countries[countryIdx];
          return (
            <div
              key={country.iso3}
              className="flex items-center gap-3 p-5 rounded-xl border-2 border-border bg-surface"
            >
              <span className="w-10 h-10 rounded-full bg-surface flex items-center justify-center font-bold text-lg shrink-0">
                {position + 1}
              </span>
              <span className="text-3xl sm:text-4xl">{country.flagEmoji}</span>
              <span className="font-bold text-lg flex-1">{country.displayName}</span>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleMoveUp(position)}
                  disabled={position === 0}
                  className="p-2 text-lg rounded-lg border border-border hover:bg-surface disabled:opacity-30 transition-colors leading-none"
                >
                  ▲
                </button>
                <button
                  onClick={() => handleMoveDown(position)}
                  disabled={position === state.userOrder.length - 1}
                  className="p-2 text-lg rounded-lg border border-border hover:bg-surface disabled:opacity-30 transition-colors leading-none"
                >
                  ▼
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => dispatch({ type: "SUBMIT" })}
          className="w-full sm:w-auto px-12 py-5 bg-gold text-white font-bold text-xl rounded-xl hover:opacity-90 transition-colors"
        >
          Submit Order
        </button>
      </div>
    </div>
  );
}
