"use client";

import { useReducer, useState, useCallback } from "react";
import {
  createHoL,
  guess,
  type HoLState,
} from "@/lib/game-logic/higher-or-lower/engine";
import { getDailyRng } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { cn, formatStat } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";

interface HoLBoardProps {
  mode: "daily" | "practice";
}

function init(mode: "daily" | "practice"): HoLState {
  const rng = mode === "daily" ? getDailyRng(new Date().toISOString().slice(0, 10)) : mulberry32(Date.now());
  return createHoL(rng);
}

type Action = { type: "GUESS"; choice: "higher" | "lower" } | { type: "RESET" };

function reducer(state: HoLState, action: Action): HoLState {
  switch (action.type) {
    case "GUESS": return guess(state, action.choice);
    case "RESET": return init("practice");
    default: return state;
  }
}

export function HoLBoard({ mode }: HoLBoardProps) {
  const [state, dispatch] = useReducer(reducer, mode, init);
  const [showReveal, setShowReveal] = useState(false);

  const round = state.rounds[state.currentRound];

  const handleGuess = useCallback((choice: "higher" | "lower") => {
    if (showReveal) return;
    setShowReveal(true);
    setTimeout(() => {
      dispatch({ type: "GUESS", choice });
      setShowReveal(false);
    }, 1200);
  }, [showReveal]);

  if (state.phase === "gameover") {
    return (
      <GameOverScreen
        title={state.lastAnswer === "wrong" ? "Game Over!" : "All Rounds Complete!"}
        score={`${state.streak} streak`}
        subtitle={`Best: ${state.bestStreak}`}
        onPlayAgain={mode === "practice" ? () => dispatch({ type: "RESET" }) : undefined}
      />
    );
  }

  if (!round) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between text-sm text-text-muted">
        <span>🔥 Streak: <span className="font-bold text-text">{state.streak}</span></span>
        <span>{round.category.emoji} {round.category.label}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Left country - value shown */}
        <div className="flex flex-col items-center p-6 rounded-xl border-2 border-border bg-surface-muted">
          <span className="text-5xl mb-3">{round.left.flagEmoji}</span>
          <span className="font-bold text-sm">{round.left.displayName}</span>
          <span className="text-lg font-mono font-bold mt-2">
            {formatStat(round.leftValue, round.category.unit)}
          </span>
        </div>

        {/* Right country - value hidden */}
        <div className="flex flex-col items-center p-6 rounded-xl border-2 border-brand/30 bg-brand/5">
          <span className="text-5xl mb-3">{round.right.flagEmoji}</span>
          <span className="font-bold text-sm">{round.right.displayName}</span>
          {showReveal ? (
            <span className="text-lg font-mono font-bold mt-2">
              {formatStat(round.rightValue, round.category.unit)}
            </span>
          ) : (
            <span className="text-lg font-bold mt-2 text-text-muted">?</span>
          )}
        </div>
      </div>

      <p className="text-center text-sm text-text-muted">
        Is <span className="font-bold text-text">{round.right.displayName}</span>&apos;s{" "}
        {round.category.label.toLowerCase()} higher or lower?
      </p>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleGuess("higher")}
          disabled={showReveal}
          className="p-4 rounded-xl border-2 border-correct/30 bg-correct/5 hover:border-correct hover:bg-correct/10 font-bold transition-all"
        >
          ⬆️ Higher
        </button>
        <button
          onClick={() => handleGuess("lower")}
          disabled={showReveal}
          className="p-4 rounded-xl border-2 border-incorrect/30 bg-incorrect/5 hover:border-incorrect hover:bg-incorrect/10 font-bold transition-all"
        >
          ⬇️ Lower
        </button>
      </div>
    </div>
  );
}
