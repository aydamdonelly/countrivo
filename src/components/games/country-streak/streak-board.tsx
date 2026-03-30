"use client";

import { useReducer, useState, useCallback, useRef } from "react";
import {
  createStreak,
  answerStreak,
  type StreakState,
} from "@/lib/game-logic/country-streak/engine";
import { getDailyRng } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { cn } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";

interface StreakBoardProps {
  mode: "daily" | "practice";
}

function init(mode: "daily" | "practice"): StreakState {
  const rng = mode === "daily" ? getDailyRng(new Date().toISOString().slice(0, 10)) : mulberry32(Date.now());
  return createStreak(rng);
}

export function StreakBoard({ mode }: StreakBoardProps) {
  const rngRef = useRef(mode === "daily" ? getDailyRng(new Date().toISOString().slice(0, 10)) : mulberry32(Date.now()));
  const [state, setState] = useState(() => init(mode));
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const currentCountry = state.queue[state.currentIndex];

  const handleAnswer = useCallback((idx: number) => {
    if (showFeedback) return;
    setSelectedIdx(idx);
    setShowFeedback(true);
    setTimeout(() => {
      setState((s) => answerStreak(s, idx, rngRef.current));
      setShowFeedback(false);
      setSelectedIdx(null);
    }, 600);
  }, [showFeedback]);

  const handleReset = useCallback(() => {
    rngRef.current = mulberry32(Date.now());
    setState(createStreak(rngRef.current));
  }, []);

  if (state.phase === "gameover") {
    return (
      <GameOverScreen
        title="Streak Over!"
        score={`🔥 ${state.streak}`}
        subtitle={state.streak === 0 ? "Better luck next time!" : `Best: ${state.bestStreak}`}
        onPlayAgain={mode === "practice" ? handleReset : undefined}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between text-sm text-text-muted">
        <span>🔥 Streak: <span className="font-bold text-text text-lg">{state.streak}</span></span>
      </div>

      <div className="text-center py-8">
        <span className="text-8xl">{currentCountry.flagEmoji}</span>
        <p className="text-text-muted text-sm mt-4">Which country is this?</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {state.options.map((option, idx) => {
          const isCorrect = idx === state.correctIndex;
          const isSelected = selectedIdx === idx;

          return (
            <button
              key={`${state.currentIndex}-${option.iso3}`}
              onClick={() => handleAnswer(idx)}
              disabled={showFeedback}
              className={cn(
                "p-4 rounded-xl border-2 text-left font-medium transition-all",
                !showFeedback && "border-border hover:border-brand/50 hover:bg-surface-muted",
                showFeedback && isCorrect && "border-correct bg-correct/10",
                showFeedback && isSelected && !isCorrect && "border-incorrect bg-incorrect/10",
                showFeedback && !isCorrect && !isSelected && "border-border opacity-50"
              )}
            >
              {option.displayName}
            </button>
          );
        })}
      </div>
    </div>
  );
}
