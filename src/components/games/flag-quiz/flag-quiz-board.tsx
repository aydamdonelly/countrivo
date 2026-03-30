"use client";

import { useReducer, useState, useEffect, useCallback } from "react";
import {
  createFlagQuiz,
  answerQuestion,
  type FlagQuizState,
} from "@/lib/game-logic/flag-quiz/engine";
import { getDailyRng } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { cn } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";

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
    }, 800);
  }, [showFeedback]);

  if (state.phase === "results") {
    return (
      <GameOverScreen
        title="Flag Quiz Complete!"
        score={`${state.score} / ${state.questions.length}`}
        subtitle={state.score === state.questions.length ? "Perfect!" : "Keep practicing!"}
        onPlayAgain={mode === "practice" ? () => dispatch({ type: "RESET" }) : undefined}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-text-muted">
        <span>
          Question <span className="font-bold text-text">{state.currentQuestion + 1}</span> of{" "}
          {state.questions.length}
        </span>
        <span>Score: <span className="font-bold text-text">{state.score}</span></span>
      </div>

      {/* Flag */}
      <div className="text-center py-8">
        <span className="text-8xl">{currentQ.country.flagEmoji}</span>
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
