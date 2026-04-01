"use client";

import { useReducer, useState, useEffect, useCallback, useMemo } from "react";
import {
  createFlagQuiz,
  answerQuestion,
  type FlagQuizState,
} from "@/lib/game-logic/flag-quiz/engine";
import { getDailyRng } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { cn } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";
import { useGameKeys } from "@/hooks/use-game-keys";

interface FlagQuizBoardProps {
  mode: "daily" | "practice";
}

type Action =
  | { type: "ANSWER"; optionIndex: number }
  | { type: "RESET" };

function init(mode: "daily" | "practice"): FlagQuizState {
  const rng = mode === "daily" ? getDailyRng(new Date().toISOString().slice(0, 10)) : mulberry32(Date.now());
  return createFlagQuiz(rng);
}

function reducer(state: FlagQuizState, action: Action): FlagQuizState {
  switch (action.type) {
    case "ANSWER":
      return answerQuestion(state, action.optionIndex);
    case "RESET":
      return init("practice");
    default:
      return state;
  }
}

export function FlagQuizBoard({ mode }: FlagQuizBoardProps) {
  const [state, dispatch] = useReducer(reducer, mode, init);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const currentQ = state.questions[state.currentQuestion];

  const handleAnswer = useCallback((idx: number) => {
    if (showFeedback) return;
    setSelectedIdx(idx);
    setShowFeedback(true);
    setTimeout(() => {
      dispatch({ type: "ANSWER", optionIndex: idx });
      setShowFeedback(false);
      setSelectedIdx(null);
    }, 1200);
  }, [showFeedback]);

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

  useGameKeys(keymap, state.phase !== "results");

  if (state.phase === "results") {
    const pct = Math.round((state.score / state.questions.length) * 100);
    return (
      <GameOverScreen
        title="Flag Quiz Complete!"
        score={`${state.score} / ${state.questions.length}`}
        subtitle={
          state.score === state.questions.length
            ? "Perfect score!"
            : `${pct}% — ${pct >= 70 ? "Great job!" : "Keep practicing!"}`
        }
        onPlayAgain={mode === "practice" ? () => dispatch({ type: "RESET" }) : undefined}
        numericScore={state.score}
        maxScore={state.questions.length}
        gameSlug="flag-quiz"
      />
    );
  }

  const progress = ((state.currentQuestion) / state.questions.length) * 100;

  return (
    <div className="flex flex-col gap-8">
      {/* Score progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-base text-cream-muted">
          <span>
            Question <span className="font-bold text-cream text-lg">{state.currentQuestion + 1}</span> of{" "}
            {state.questions.length}
          </span>
          <span className="text-lg">
            Score: <span className="font-bold text-gold">{state.score}</span>
          </span>
        </div>
        <div className="w-full h-3 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flag */}
      <div className="text-center py-6">
        <span className="text-[7rem] leading-none block">{currentQ.country.flagEmoji}</span>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3">
        {currentQ.options.map((option, idx) => {
          const isCorrect = idx === currentQ.correctIndex;
          const isSelected = selectedIdx === idx;

          return (
            <button
              key={option.iso3}
              onClick={() => handleAnswer(idx)}
              disabled={showFeedback}
              className={cn(
                "p-5 min-h-13 rounded-xl border-2 text-left text-lg font-medium transition-all w-full",
                !showFeedback && "border-black/10 hover:border-black/20 hover:bg-black/3 active:scale-[0.98]",
                showFeedback && isCorrect && "border-correct bg-correct/10" + (isSelected ? " animate-scale-in" : ""),
                showFeedback && isSelected && !isCorrect && "border-incorrect bg-incorrect/10 animate-[shake_0.4s_ease]",
                showFeedback && !isCorrect && !isSelected && "border-border opacity-50"
              )}
            >
              <span>{option.displayName}</span>
              {/* Show correct answer label when user got it wrong */}
              {showFeedback && isCorrect && selectedIdx !== idx && (
                <span className="block text-sm text-correct font-bold mt-1">
                  Correct answer
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
