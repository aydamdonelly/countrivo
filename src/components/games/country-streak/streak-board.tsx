"use client";

import { useReducer, useState, useCallback, useRef, useMemo } from "react";
import {
  createStreak,
  answerStreak,
  type StreakState,
} from "@/lib/game-logic/country-streak/engine";
import { getDailyRng } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { cn } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";
import { useGameKeys } from "@/hooks/use-game-keys";

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

  const keymap = useMemo(() => {
    const map: Record<string, () => void> = {};
    if (!showFeedback) {
      map["1"] = () => handleAnswer(0);
      map["2"] = () => handleAnswer(1);
      map["3"] = () => handleAnswer(2);
      map["4"] = () => handleAnswer(3);
    }
    return map;
  }, [showFeedback, handleAnswer]);

  useGameKeys(keymap, state.phase !== "gameover");

  if (state.phase === "gameover") {
    return (
      <GameOverScreen
        title="Streak Over!"
        score={`🔥 ${state.streak}`}
        subtitle={state.streak === 0 ? "Better luck next time!" : `Best: ${state.bestStreak}`}
        onPlayAgain={mode === "practice" ? handleReset : undefined}
        numericScore={state.streak}
        maxScore={20}
        gameSlug="country-streak"
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Streak counter */}
      <div className="flex items-center justify-center gap-3">
        <span className="text-3xl">🔥</span>
        <span
          key={state.streak}
          className={cn(
            "font-extrabold font-mono transition-all animate-count-up",
            state.streak > 0 ? "text-6xl text-gold" : "text-4xl text-cream-muted"
          )}
        >
          {state.streak}
        </span>
      </div>

      {/* Flag */}
      <div className="text-center py-4">
        <span className="text-[7rem] leading-none block">{currentCountry.flagEmoji}</span>
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
                "p-5 min-h-13 rounded-xl border-2 text-left text-lg font-medium transition-all w-full",
                !showFeedback && "border-black/10 hover:border-black/20 hover:bg-black/3 active:scale-[0.98]",
                showFeedback && isCorrect && "border-correct bg-correct/10",
                showFeedback && isSelected && !isCorrect && "border-incorrect bg-incorrect/10",
                showFeedback && !isCorrect && !isSelected && "border-border opacity-50"
              )}
            >
              <span>{option.displayName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
