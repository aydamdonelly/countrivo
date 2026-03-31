"use client";

import { useCallback, useReducer, useState, useEffect } from "react";
import Link from "next/link";
import {
  createGame,
  getCurrentCountry,
  getAvailableCategories,
  assignCategory,
  isComplete,
} from "@/lib/game-logic/country-draft/engine";
import { computeResult } from "@/lib/game-logic/country-draft/scoring";
import type { DraftGameState, DraftResult } from "@/lib/game-logic/country-draft/types";
import { CategorySlot } from "./category-slot";
import { CountryReveal } from "./country-reveal";
import { OptimalComparison } from "./optimal-comparison";
import { DraftShareCard } from "./draft-share-card";

type Action =
  | { type: "ASSIGN"; categoryIdx: number }
  | { type: "RESET"; mode: "daily" | "practice" };

function reducer(state: DraftGameState, action: Action): DraftGameState {
  switch (action.type) {
    case "ASSIGN":
      return assignCategory(state, action.categoryIdx);
    case "RESET":
      return createGame(action.mode);
    default:
      return state;
  }
}

interface DraftBoardProps {
  mode: "daily" | "practice";
  onComplete?: (result: DraftResult) => void;
}

const GRADE_CONFIG: Record<string, { color: string; bg: string; message: string }> = {
  perfect: { color: "text-gold", bg: "bg-gold-dim", message: "You found the optimal solution!" },
  excellent: { color: "text-correct", bg: "bg-correct-light", message: "Nearly perfect play." },
  great: { color: "text-accent", bg: "bg-accent/10", message: "Strong strategic thinking." },
  good: { color: "text-gold", bg: "bg-gold-dim", message: "Solid run. Room to improve." },
  okay: { color: "text-cream-muted", bg: "bg-surface", message: "Keep practicing!" },
  poor: { color: "text-cream-muted", bg: "bg-surface", message: "Tough set. Try again!" },
};

export function DraftBoard({ mode, onComplete }: DraftBoardProps) {
  const [state, dispatch] = useReducer(reducer, null as unknown as DraftGameState, () => createGame(mode));
  const [mounted, setMounted] = useState(false);
  const [result, setResult] = useState<DraftResult | null>(null);

  const currentCountry = getCurrentCountry(state);
  const gameComplete = isComplete(state);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (gameComplete && !result) {
      const r = computeResult(state);
      setResult(r);
      onComplete?.(r);
    }
  }, [gameComplete, result, state, onComplete]);

  const handleAssign = useCallback(
    (categoryIdx: number) => {
      if (gameComplete) return;
      dispatch({ type: "ASSIGN", categoryIdx });
    },
    [gameComplete]
  );

  const handlePlayAgain = useCallback(() => {
    setResult(null);
    dispatch({ type: "RESET", mode: "practice" });
  }, []);

  // Prevent hydration mismatch — don't render game content until mounted
  if (!mounted) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4 animate-pulse">🎯</div>
        <p className="text-cream-muted">Setting up your game...</p>
      </div>
    );
  }

  // ─── Results Phase ────────────────────────────────────────────────
  if (result) {
    const grade = GRADE_CONFIG[result.grade] || GRADE_CONFIG.poor;

    return (
      <div className="flex flex-col gap-10">
        {/* Score hero */}
        <div className={`text-center p-10 sm:p-14 rounded-2xl ${grade.bg}`}>
          <div className="text-6xl sm:text-7xl mb-4 animate-scale-in">
            {"⭐".repeat(result.stars)}
          </div>
          <h2 className={`text-4xl sm:text-5xl font-extrabold capitalize ${grade.color} animate-count-up`}>
            {result.grade}!
          </h2>
          <p className="text-lg text-cream-muted mt-3">{grade.message}</p>

          <div className="flex items-center justify-center gap-8 sm:gap-12 mt-8">
            <div>
              <div className="text-4xl sm:text-5xl font-extrabold font-mono">{result.playerScore}</div>
              <div className="text-base text-cream-muted mt-1">Your Score</div>
            </div>
            <div className="w-px h-14 bg-border" />
            <div>
              <div className="text-4xl sm:text-5xl font-extrabold font-mono">{result.optimalScore}</div>
              <div className="text-base text-cream-muted mt-1">Optimal</div>
            </div>
            <div className="w-px h-14 bg-border" />
            <div>
              <div className="text-4xl sm:text-5xl font-extrabold font-mono">{result.gap}</div>
              <div className="text-base text-cream-muted mt-1">Gap</div>
            </div>
          </div>
        </div>

        {/* Comparison table */}
        <OptimalComparison
          config={state.config}
          playerAssignments={result.assignments}
          optimalAssignments={result.optimalAssignments}
        />

        {/* Share */}
        <DraftShareCard result={result} dateKey={state.config.dateKey} config={state.config} />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {mode === "practice" && (
            <button
              onClick={handlePlayAgain}
              className="px-8 py-4 bg-gold text-white font-bold text-lg rounded-xl hover:opacity-90 transition-colors"
            >
              Play Again
            </button>
          )}
          {mode === "daily" && (
            <Link
              href="/games/country-draft/play?mode=practice"
              className="px-8 py-4 bg-gold text-white font-bold text-lg rounded-xl hover:opacity-90 transition-colors text-center"
            >
              Try Practice Mode
            </Link>
          )}
        </div>

        {/* Discovery: play another game */}
        <div className="border-t border-border pt-8">
          <p className="text-base font-bold text-cream-muted uppercase tracking-wide mb-4">Try another game</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link href="/games/higher-or-lower" className="game-card p-5 border border-border bg-surface text-center">
              <span className="text-3xl block mb-2">⬆️</span>
              <span className="text-base font-bold">Higher or Lower</span>
            </Link>
            <Link href="/games/flag-quiz" className="game-card p-5 border border-border bg-surface text-center">
              <span className="text-3xl block mb-2">🏁</span>
              <span className="text-base font-bold">Flag Quiz</span>
            </Link>
            <Link href="/games/population-sort" className="game-card p-5 border border-border bg-surface text-center">
              <span className="text-3xl block mb-2">📊</span>
              <span className="text-base font-bold">Population Sort</span>
            </Link>
            <Link href="/games/capital-match" className="game-card p-5 border border-border bg-surface text-center">
              <span className="text-3xl block mb-2">🏛️</span>
              <span className="text-base font-bold">Capital Match</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Playing Phase ────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* Progress bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-3 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all duration-500"
            style={{ width: `${(state.currentStep / state.config.countries.length) * 100}%` }}
          />
        </div>
        <span className="text-lg font-bold text-cream-muted tabular-nums">
          {state.currentStep + 1}/{state.config.countries.length}
        </span>
      </div>

      {/* Current country */}
      {currentCountry && (
        <CountryReveal country={currentCountry} step={state.currentStep} />
      )}

      {/* Category slots */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {state.config.categories.map((cat, idx) => {
          const assignedStep = state.assignments.indexOf(idx);
          const assignedCountry =
            assignedStep !== -1 ? state.config.countries[assignedStep] : null;
          const rank =
            assignedStep !== -1 ? state.config.costMatrix[assignedStep][idx] : null;

          return (
            <CategorySlot
              key={cat.slug}
              category={cat}
              isAvailable={!state.usedCategories.has(idx)}
              assignedCountry={assignedCountry}
              rank={rank}
              onClick={() => handleAssign(idx)}
            />
          );
        })}
      </div>

      {/* Hint */}
      <p className="text-center text-lg text-cream-muted">
        Which category should{" "}
        <span className="font-bold text-cream">{currentCountry?.displayName}</span>{" "}
        go in?
      </p>
    </div>
  );
}
