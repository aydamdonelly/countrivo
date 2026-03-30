"use client";

import { useReducer, useState, useCallback } from "react";
import {
  createCapitalMatch,
  answerCapital,
  type CapitalMatchState,
} from "@/lib/game-logic/capital-match/engine";
import { getDailyRng } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { cn } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";

interface CapitalBoardProps {
  mode: "daily" | "practice";
}

function init(mode: "daily" | "practice"): CapitalMatchState {
  const rng = mode === "daily" ? getDailyRng(new Date().toISOString().slice(0, 10)) : mulberry32(Date.now());
  return createCapitalMatch(rng);
}

type Action = { type: "ANSWER"; idx: number } | { type: "RESET" };

function reducer(state: CapitalMatchState, action: Action): CapitalMatchState {
  switch (action.type) {
    case "ANSWER": return answerCapital(state, action.idx);
    case "RESET": return init("practice");
    default: return state;
  }
}

export function CapitalBoard({ mode }: CapitalBoardProps) {
  const [state, dispatch] = useReducer(reducer, mode, init);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const currentQ = state.questions[state.currentQuestion];

  const handleAnswer = useCallback((idx: number) => {
    if (showFeedback) return;
    setSelectedIdx(idx);
    setShowFeedback(true);
    setTimeout(() => {
      dispatch({ type: "ANSWER", idx });
      setShowFeedback(false);
      setSelectedIdx(null);
    }, 800);
  }, [showFeedback]);

  if (state.phase === "results") {
    return (
      <GameOverScreen
        title="Capital Match Complete!"
        score={`${state.score} / ${state.questions.length}`}
        onPlayAgain={mode === "practice" ? () => dispatch({ type: "RESET" }) : undefined}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between text-sm text-text-muted">
        <span>Question <span className="font-bold text-text">{state.currentQuestion + 1}</span> of {state.questions.length}</span>
        <span>Score: <span className="font-bold text-text">{state.score}</span></span>
      </div>

      <div className="text-center py-6">
        <span className="text-6xl mb-3 block">{currentQ.country.flagEmoji}</span>
        <h2 className="text-2xl font-bold">{currentQ.country.displayName}</h2>
        <p className="text-text-muted text-sm mt-1">What is the capital?</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {currentQ.options.map((option, idx) => {
          const isCorrect = idx === currentQ.correctIndex;
          const isSelected = selectedIdx === idx;

          return (
            <button
              key={idx}
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
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
