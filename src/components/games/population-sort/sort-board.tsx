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
          <div className="w-full max-w-md space-y-2">
            {state.correctOrder.map((countryIdx, rank) => {
              const country = state.countries[countryIdx];
              const userRank = state.userOrder.indexOf(countryIdx);
              const isCorrect = userRank === rank;
              const value = stats[country.iso3]?.[state.category.slug];

              return (
                <div
                  key={country.iso3}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    isCorrect ? "border-correct/30 bg-correct/5" : "border-incorrect/30 bg-incorrect/5"
                  )}
                >
                  <span className="font-bold text-sm w-6 text-center">{rank + 1}</span>
                  <span className="text-2xl">{country.flagEmoji}</span>
                  <span className="font-medium flex-1">{country.displayName}</span>
                  <span className="text-sm font-mono text-text-muted">
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
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <p className="text-sm text-text-muted">
          Sort by <span className="font-bold text-text">{state.category.emoji} {state.category.label}</span> — highest first
        </p>
      </div>

      <div className="space-y-2">
        {state.userOrder.map((countryIdx, position) => {
          const country = state.countries[countryIdx];
          return (
            <div
              key={country.iso3}
              className="flex items-center gap-2 p-3 rounded-xl border border-border bg-surface"
            >
              <span className="font-bold text-sm text-text-muted w-6 text-center">
                {position + 1}
              </span>
              <span className="text-2xl">{country.flagEmoji}</span>
              <span className="font-medium flex-1">{country.displayName}</span>
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => handleMoveUp(position)}
                  disabled={position === 0}
                  className="px-2 py-0.5 text-xs rounded border border-border hover:bg-surface-muted disabled:opacity-30 transition-colors"
                >
                  ▲
                </button>
                <button
                  onClick={() => handleMoveDown(position)}
                  disabled={position === state.userOrder.length - 1}
                  className="px-2 py-0.5 text-xs rounded border border-border hover:bg-surface-muted disabled:opacity-30 transition-colors"
                >
                  ▼
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => dispatch({ type: "SUBMIT" })}
        className="mx-auto px-8 py-3 bg-brand text-white font-semibold rounded-xl hover:bg-brand-dark transition-colors"
      >
        Submit Order
      </button>
    </div>
  );
}
