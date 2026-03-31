"use client";

import { useReducer, useState, useCallback, useMemo } from "react";
import {
  createHoL,
  guess,
  type HoLState,
} from "@/lib/game-logic/higher-or-lower/engine";
import { getDailyRng } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { cn, formatStat } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";
import { useGameKeys } from "@/hooks/use-game-keys";

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
  const [lastChoice, setLastChoice] = useState<"higher" | "lower" | null>(null);

  const round = state.rounds[state.currentRound];

  const handleGuess = useCallback((choice: "higher" | "lower") => {
    if (showReveal) return;
    setLastChoice(choice);
    setShowReveal(true);
    setTimeout(() => {
      dispatch({ type: "GUESS", choice });
      setShowReveal(false);
      setLastChoice(null);
    }, 1500);
  }, [showReveal]);

  const keymap = useMemo(() => {
    const map: Record<string, () => void> = {};
    if (!showReveal) {
      map["ArrowUp"] = () => handleGuess("higher");
      map["ArrowDown"] = () => handleGuess("lower");
    }
    return map;
  }, [showReveal, handleGuess]);

  useGameKeys(keymap, state.phase !== "gameover" && !showReveal);

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

  const isCorrectGuess = lastChoice === round.answer;

  return (
    <div className="flex flex-col gap-8">
      {/* Streak counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <span className={cn(
            "font-extrabold font-mono transition-all",
            state.streak > 0 ? "text-4xl text-gold" : "text-3xl text-cream-muted"
          )}>
            {state.streak}
          </span>
        </div>
        <span className="text-base text-cream-muted font-medium">
          {round.category.emoji} {round.category.label}
        </span>
      </div>

      {/* Country cards */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {/* Left country - value shown */}
        <div className={cn(
          "flex flex-col items-center p-6 sm:p-8 rounded-xl border-2 transition-all",
          showReveal && isCorrectGuess ? "border-correct/50 bg-correct/5" : "border-border bg-surface",
          showReveal && !isCorrectGuess ? "border-incorrect/50 bg-incorrect/5" : ""
        )}>
          <span className="text-7xl sm:text-8xl mb-3">{round.left.flagEmoji}</span>
          <span className="font-bold text-base sm:text-lg text-center">{round.left.displayName}</span>
          <span className="text-2xl sm:text-3xl font-mono font-extrabold mt-3 text-cream">
            {formatStat(round.leftValue, round.category.unit)}
          </span>
        </div>

        {/* Right country - value hidden until reveal */}
        <div className={cn(
          "flex flex-col items-center p-6 sm:p-8 rounded-xl border-2 transition-all",
          !showReveal && "border-border bg-gold-dim",
          showReveal && isCorrectGuess && "border-correct bg-correct/10",
          showReveal && !isCorrectGuess && "border-incorrect bg-incorrect/10"
        )}>
          <span className="text-7xl sm:text-8xl mb-3">{round.right.flagEmoji}</span>
          <span className="font-bold text-base sm:text-lg text-center">{round.right.displayName}</span>
          {showReveal ? (
            <span className={cn(
              "text-2xl sm:text-3xl font-mono font-extrabold mt-3",
              isCorrectGuess ? "text-correct" : "text-incorrect"
            )}>
              {formatStat(round.rightValue, round.category.unit)}
            </span>
          ) : (
            <span className="text-3xl font-bold mt-3 text-gold">?</span>
          )}
        </div>
      </div>

      <p className="text-center text-lg text-cream-muted">
        Is <span className="font-bold text-cream">{round.right.displayName}</span>&apos;s{" "}
        <span className="font-bold text-cream">{round.category.label.toLowerCase()}</span> higher or lower?
      </p>

      {/* Higher / Lower buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleGuess("higher")}
          disabled={showReveal}
          className="py-6 px-4 rounded-xl border-2 border-correct/30 bg-correct/5 hover:border-correct hover:bg-correct/10 font-bold text-xl transition-all w-full disabled:opacity-60"
        >
          <span className="block text-2xl mb-1">⬆️</span>
          Higher
        </button>
        <button
          onClick={() => handleGuess("lower")}
          disabled={showReveal}
          className="py-6 px-4 rounded-xl border-2 border-incorrect/30 bg-incorrect/5 hover:border-incorrect hover:bg-incorrect/10 font-bold text-xl transition-all w-full disabled:opacity-60"
        >
          <span className="block text-2xl mb-1">⬇️</span>
          Lower
        </button>
      </div>
    </div>
  );
}
