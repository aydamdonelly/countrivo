"use client";

import { useReducer, useEffect, useCallback } from "react";
import {
  createSpeedFlags,
  startGame,
  answer,
  tick,
  type SpeedFlagsState,
} from "@/lib/game-logic/speed-flags/engine";
import { mulberry32 } from "@/lib/seeded-random";
import { cn } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";

interface SpeedBoardProps {
  mode: "daily" | "practice";
}

function init(): SpeedFlagsState {
  const rng = mulberry32(Date.now());
  return createSpeedFlags(rng);
}

type Action =
  | { type: "START" }
  | { type: "ANSWER"; idx: number }
  | { type: "TICK" }
  | { type: "RESET" };

function reducer(state: SpeedFlagsState, action: Action): SpeedFlagsState {
  switch (action.type) {
    case "START": return startGame(state);
    case "ANSWER": return answer(state, action.idx);
    case "TICK": return tick(state);
    case "RESET": return init();
    default: return state;
  }
}

export function SpeedBoard({ mode }: SpeedBoardProps) {
  const [state, dispatch] = useReducer(reducer, undefined, init);

  // Timer
  useEffect(() => {
    if (state.phase !== "playing") return;
    const interval = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(interval);
  }, [state.phase]);

  const handleAnswer = useCallback((idx: number) => {
    dispatch({ type: "ANSWER", idx });
  }, []);

  // Ready screen
  if (state.phase === "ready") {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <span className="text-6xl">⚡</span>
        <h2 className="text-2xl font-bold">Ready?</h2>
        <p className="text-cream-muted text-center">
          Identify as many flags as possible in 60 seconds.<br />
          Each flag has 2 options. Be fast!
        </p>
        <button
          onClick={() => dispatch({ type: "START" })}
          className="px-8 py-4 bg-gold text-bg font-bold text-lg rounded-xl hover:opacity-90 transition-colors"
        >
          Start!
        </button>
      </div>
    );
  }

  // Results
  if (state.phase === "results") {
    const accuracy = state.total > 0 ? Math.round((state.correct / state.total) * 100) : 0;
    return (
      <GameOverScreen
        title="Time's Up!"
        score={`${state.correct} correct`}
        subtitle={`${state.total} attempts, ${accuracy}% accuracy`}
        onPlayAgain={() => dispatch({ type: "RESET" })}
      />
    );
  }

  // Playing
  const question = state.queue[state.currentIdx];
  if (!question) {
    return (
      <GameOverScreen
        title="All Done!"
        score={`${state.correct} correct`}
        subtitle={`Out of ${state.total} attempts`}
        onPlayAgain={() => dispatch({ type: "RESET" })}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Timer and score bar */}
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "text-2xl font-bold font-mono",
            state.timeLeft <= 10 ? "text-incorrect" : "text-cream"
          )}
        >
          {state.timeLeft}s
        </div>
        <div className="text-sm text-cream-muted">
          Score: <span className="font-bold text-cream">{state.correct}</span>
        </div>
      </div>

      {/* Timer bar */}
      <div className="w-full h-2 rounded-full bg-surface overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000",
            state.timeLeft <= 10 ? "bg-incorrect" : "bg-gold"
          )}
          style={{ width: `${(state.timeLeft / 60) * 100}%` }}
        />
      </div>

      {/* Flag */}
      <div className="text-center py-8">
        <span className="text-8xl">{question.country.flagEmoji}</span>
      </div>

      {/* Two options */}
      <div className="grid grid-cols-2 gap-4">
        {question.options.map((option, idx) => (
          <button
            key={option.iso3}
            onClick={() => handleAnswer(idx)}
            className="p-5 rounded-xl border-2 border-border hover:border-border-hover hover:bg-surface font-bold text-sm transition-all"
          >
            {option.displayName}
          </button>
        ))}
      </div>
    </div>
  );
}
