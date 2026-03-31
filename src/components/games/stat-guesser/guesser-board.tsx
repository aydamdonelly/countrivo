"use client";

import { useReducer, useState, useCallback } from "react";
import {
  createStatGuesser,
  submitGuess,
  nextRound,
  type StatGuesserState,
} from "@/lib/game-logic/stat-guesser/engine";
import { getDailyRng } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { cn, formatStat } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";

interface GuesserBoardProps {
  mode: "daily" | "practice";
}

function init(mode: "daily" | "practice"): StatGuesserState {
  const rng = mode === "daily" ? getDailyRng(new Date().toISOString().slice(0, 10)) : mulberry32(Date.now());
  return createStatGuesser(rng);
}

type Action =
  | { type: "SUBMIT"; value: number }
  | { type: "NEXT" }
  | { type: "RESET" };

function reducer(state: StatGuesserState, action: Action): StatGuesserState {
  switch (action.type) {
    case "SUBMIT": return submitGuess(state, action.value);
    case "NEXT": return nextRound(state);
    case "RESET": return init("practice");
    default: return state;
  }
}

export function GuesserBoard({ mode }: GuesserBoardProps) {
  const [state, dispatch] = useReducer(reducer, mode, init);
  const [inputValue, setInputValue] = useState("");

  const round = state.rounds[state.currentRound];

  const handleSubmit = useCallback(() => {
    const parsed = parseFloat(inputValue.replace(/,/g, ""));
    if (isNaN(parsed)) return;
    dispatch({ type: "SUBMIT", value: parsed });
    setInputValue("");
  }, [inputValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        if (state.phase === "feedback") {
          dispatch({ type: "NEXT" });
        } else {
          handleSubmit();
        }
      }
    },
    [state.phase, handleSubmit]
  );

  if (state.phase === "results") {
    const totalError = state.scores.reduce((sum, s) => sum! + (s ?? 0), 0) as number;
    const avgError = Math.round((totalError / state.rounds.length) * 10) / 10;

    return (
      <GameOverScreen
        title="Stat Guesser Complete!"
        score={`${avgError}% avg error`}
        subtitle={avgError < 20 ? "Excellent!" : avgError < 50 ? "Good effort!" : "Keep practicing!"}
        onPlayAgain={mode === "practice" ? () => dispatch({ type: "RESET" }) : undefined}
      >
        <div className="w-full max-w-md space-y-2">
          {state.rounds.map((r, i) => {
            const error = state.scores[i] ?? 0;
            return (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  error < 20
                    ? "border-correct/30 bg-correct/5"
                    : "border-incorrect/30 bg-incorrect/5"
                )}
              >
                <span className="text-2xl">{r.country.flagEmoji}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{r.country.displayName}</div>
                  <div className="text-xs text-cream-muted">{r.category.label}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono">{formatStat(r.actualValue, r.category.unit)}</div>
                  <div className="text-xs text-cream-muted">{error}% off</div>
                </div>
              </div>
            );
          })}
        </div>
      </GameOverScreen>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-cream-muted">
        <span>
          Round <span className="font-bold text-cream">{state.currentRound + 1}</span> of{" "}
          {state.rounds.length}
        </span>
        <span>{round.category.emoji} {round.category.label}</span>
      </div>

      {/* Country */}
      <div className="text-center py-6">
        <span className="text-7xl block mb-3">{round.country.flagEmoji}</span>
        <h2 className="text-2xl font-bold">{round.country.displayName}</h2>
        <p className="text-sm text-cream-muted mt-2">
          Guess the <span className="font-bold text-cream">{round.category.label}</span>
          {round.category.unit ? ` (${round.category.unit})` : ""}
        </p>
      </div>

      {state.phase === "feedback" ? (
        /* Feedback after guess */
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border bg-surface text-center">
              <div className="text-xs text-cream-muted mb-1">Your guess</div>
              <div className="font-mono font-bold">
                {formatStat(state.guesses[state.currentRound]!, round.category.unit)}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-correct/30 bg-correct/5 text-center">
              <div className="text-xs text-cream-muted mb-1">Actual value</div>
              <div className="font-mono font-bold">
                {formatStat(round.actualValue, round.category.unit)}
              </div>
            </div>
          </div>

          <div className="text-center">
            <span
              className={cn(
                "text-lg font-bold",
                (state.scores[state.currentRound] ?? 100) < 20 ? "text-correct" : "text-incorrect"
              )}
            >
              {state.scores[state.currentRound]}% off
            </span>
          </div>

          <button
            onClick={() => dispatch({ type: "NEXT" })}
            className="mx-auto block px-8 py-3 bg-gold text-bg font-semibold rounded-xl hover:opacity-90 transition-colors"
          >
            {state.currentRound + 1 >= state.rounds.length ? "See Results" : "Next Round"}
          </button>
        </div>
      ) : (
        /* Guess input */
        <div className="space-y-4">
          <input
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your guess..."
            autoFocus
            className="w-full p-4 rounded-xl border-2 border-border bg-surface text-cream text-center text-lg font-mono placeholder:text-cream-muted focus:border-gold focus:outline-none transition-colors"
          />
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim()}
            className="mx-auto block px-8 py-3 bg-gold text-bg font-semibold rounded-xl hover:opacity-90 transition-colors disabled:opacity-50"
          >
            Submit Guess
          </button>
        </div>
      )}
    </div>
  );
}
