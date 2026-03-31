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
    }, 800);
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
    <div className="flex flex-col gap-8">
      {/* Streak counter */}
      <div className="flex items-center justify-center gap-3">
        <span className="text-3xl">🔥</span>
        <span className={cn(
          "font-extrabold font-mono transition-all",
          state.streak > 0 ? "text-6xl text-gold" : "text-4xl text-cream-muted"
        )}>
          {state.streak}
        </span>
      </div>

      {/* Flag */}
      <div className="text-center py-4">
        <span className="text-[10rem] leading-none block">{currentCountry.flagEmoji}</span>
        <p className="text-cream-muted text-lg mt-6 font-medium">Which country is this?</p>
      </div>

      {/* Options */}
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
                "p-5 rounded-xl border-2 text-left text-lg font-medium transition-all w-full",
                !showFeedback && "border-border hover:border-border-hover hover:bg-surface",
                showFeedback && isCorrect && "border-correct bg-correct/10",
                showFeedback && isSelected && !isCorrect && "border-incorrect bg-incorrect/10",
                showFeedback && !isCorrect && !isSelected && "border-border opacity-50"
              )}
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">{option.flagEmoji}</span>
                <span>{option.displayName}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
