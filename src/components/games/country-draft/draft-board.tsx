"use client";

import { useCallback, useReducer, useState, useEffect, useMemo, useRef } from "react";
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
import { useGameKeys } from "@/hooks/use-game-keys";
import { useAuth } from "@/components/auth/auth-provider";
import { submitGameRun } from "@/app/actions/game-runs";
import { getTodayDateKey } from "@/lib/daily-seed";
import { GameSessionTopBar } from "@/components/game/game-session-top-bar";
import { PickFeedback } from "@/components/game/pick-feedback";
import { EndgameRamp } from "@/components/game/endgame-ramp";
import type { ServerGameRun } from "@/types/server";

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
  perfect: { color: "text-gold", bg: "bg-gold-dim", message: "Flawless. Optimal solution found." },
  excellent: { color: "text-correct", bg: "bg-correct-light", message: "Nearly perfect play." },
  great: { color: "text-accent", bg: "bg-accent/10", message: "Strong strategic thinking." },
  good: { color: "text-gold", bg: "bg-gold-dim", message: "Solid run. Room at the top." },
  okay: { color: "text-cream-muted", bg: "bg-surface", message: "Close. Better picks next time." },
  poor: { color: "text-cream-muted", bg: "bg-surface", message: "Brutal draw. Run it back." },
};

export function DraftBoard({ mode, onComplete }: DraftBoardProps) {
  const [state, dispatch] = useReducer(reducer, null as unknown as DraftGameState, () => createGame(mode));
  const [mounted, setMounted] = useState(false);
  const [result, setResult] = useState<DraftResult | null>(null);
  const [serverData, setServerData] = useState<ServerGameRun | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<Parameters<typeof submitGameRun>[0] | null>(null);
  const startedAtRef = useRef<string>(new Date().toISOString());
  const { user, openAuthModal } = useAuth();

  // Pick feedback state
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [feedbackType, setFeedbackType] = useState<"good" | "neutral" | "bad">("neutral");
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackDelta, setFeedbackDelta] = useState<string | undefined>(undefined);

  const currentCountry = getCurrentCountry(state);
  const gameComplete = isComplete(state);

  // Compute running score from assignments so far
  const runningScore = useMemo(() => {
    let total = 0;
    for (let i = 0; i < state.currentStep; i++) {
      const catIdx = state.assignments[i];
      if (catIdx != null) {
        total += state.config.costMatrix[i][catIdx];
      }
    }
    return total;
  }, [state.currentStep, state.assignments, state.config.costMatrix]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (gameComplete && !result) {
      const r = computeResult(state);
      setResult(r);
      onComplete?.(r);

      // Submit to server
      const doSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);

        // Max possible score: sum of worst ranks (243 per country × 8 countries)
        const MAX_POSSIBLE = 8 * 243;

        const payload = {
          gameSlug: "country-draft",
          mode: mode as "daily" | "practice",
          dateKey: getTodayDateKey(),
          scoreRaw: r.playerScore,
          scoreMax: MAX_POSSIBLE,
          scoreSortValue: MAX_POSSIBLE - r.playerScore, // lower score = better → invert
          scoreDisplay: `Score: ${r.playerScore} (Gap: ${r.gap})`,
          resultJson: {
            playerScore: r.playerScore,
            optimalScore: r.optimalScore,
            gap: r.gap,
            grade: r.grade,
            stars: r.stars,
            assignments: r.assignments,
            optimalAssignments: r.optimalAssignments,
          },
          startedAt: startedAtRef.current,
        };

        if (user) {
          const res = await submitGameRun(payload);
          if (res.success && res.run) {
            setServerData(res.run);
          }
        } else if (mode === "daily") {
          setPendingPayload(payload);
        }
        setSubmitting(false);
      };
      doSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameComplete]);

  const handleAssign = useCallback(
    (categoryIdx: number) => {
      if (gameComplete) return;

      // Compute feedback before dispatch changes state
      const countryIdx = state.currentStep;
      const rank = state.config.costMatrix[countryIdx][categoryIdx];

      if (rank <= 5) {
        setFeedbackType("good");
        setFeedbackMsg(`Great pick! Rank #${rank}`);
      } else if (rank <= 30) {
        setFeedbackType("neutral");
        setFeedbackMsg(`Solid. Rank #${rank}`);
      } else {
        setFeedbackType("bad");
        setFeedbackMsg(`Costly. Rank #${rank}`);
      }
      setFeedbackDelta(`+${rank} points`);
      setFeedbackKey((k) => k + 1);

      dispatch({ type: "ASSIGN", categoryIdx });
    },
    [gameComplete, state.currentStep, state.config.costMatrix]
  );

  const handlePlayAgain = useCallback(() => {
    setResult(null);
    setPendingPayload(null);
    dispatch({ type: "RESET", mode: "practice" });
  }, []);

  const keymap = useMemo(() => {
    const map: Record<string, () => void> = {};
    if (currentCountry && !gameComplete) {
      state.config.categories.forEach((_, idx) => {
        if (!state.usedCategories.has(idx)) {
          map[String(idx + 1)] = () => handleAssign(idx);
        }
      });
    }
    return map;
  }, [currentCountry, gameComplete, state.config.categories, state.usedCategories, handleAssign]);

  useGameKeys(keymap, !gameComplete && !!currentCountry);

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

    const handleSaveScore = pendingPayload ? () => {
      openAuthModal(async () => {
        const res = await submitGameRun(pendingPayload);
        if (res.success && res.run) setServerData(res.run);
        setPendingPayload(null);
      });
    } : undefined;

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

          <div className="flex items-center justify-center gap-6 sm:gap-10 mt-8 flex-wrap">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-extrabold font-mono">{result.playerScore}</div>
              <div className="text-base text-cream-muted mt-1">Your Score</div>
            </div>
            <div className="w-px h-14 bg-border hidden sm:block" />
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-extrabold font-mono">{result.optimalScore}</div>
              <div className="text-base text-cream-muted mt-1">Optimal</div>
            </div>
            <div className="w-px h-14 bg-border hidden sm:block" />
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-extrabold font-mono">{result.gap}</div>
              <div className="text-base text-cream-muted mt-1">Gap</div>
            </div>
            {serverData?.rankDaily != null && (
              <>
                <div className="w-px h-14 bg-border hidden sm:block" />
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-extrabold font-mono text-gold">#{serverData.rankDaily}</div>
                  <div className="text-base text-cream-muted mt-1">Rank today</div>
                </div>
              </>
            )}
            {serverData?.percentile != null && (
              <>
                <div className="w-px h-14 bg-border hidden sm:block" />
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-extrabold font-mono">{Math.round(serverData.percentile)}%</div>
                  <div className="text-base text-cream-muted mt-1">Better than</div>
                </div>
              </>
            )}
          </div>
          {serverData?.isPersonalBest && (
            <div className="mt-4 px-4 py-2 bg-gold-dim text-gold text-sm font-bold rounded-full animate-scale-in">
              New personal best!
            </div>
          )}
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
          {handleSaveScore && (
            <button
              onClick={handleSaveScore}
              className="px-8 py-4 bg-gold text-bg font-bold text-lg rounded-xl hover:opacity-90 transition-colors"
            >
              Save my score
            </button>
          )}
          {mode === "practice" && (
            <button
              onClick={handlePlayAgain}
              className="px-8 py-4 bg-gold text-bg font-bold text-lg rounded-xl hover:opacity-90 transition-colors"
            >
              Play Again
            </button>
          )}
          {mode === "daily" && (
            <Link
              href="/games/country-draft/play?mode=practice"
              className="px-8 py-4 bg-gold text-bg font-bold text-lg rounded-xl hover:opacity-90 transition-colors text-center"
            >
              Practice unlimited
            </Link>
          )}
        </div>

        {/* Discovery: play another game */}
        <div className="border-t border-border pt-8">
          <p className="text-base font-bold text-cream-muted uppercase tracking-wide mb-4">Try another game</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link href="/games/higher-or-lower" className="game-card p-5 border border-black/5 bg-white shadow-sm text-center">
              <span className="text-3xl block mb-2">⬆️</span>
              <span className="text-base font-bold">Higher or Lower</span>
            </Link>
            <Link href="/games/flag-quiz" className="game-card p-5 border border-black/5 bg-white shadow-sm text-center">
              <span className="text-3xl block mb-2">🏁</span>
              <span className="text-base font-bold">Flag Quiz</span>
            </Link>
            <Link href="/games/population-sort" className="game-card p-5 border border-black/5 bg-white shadow-sm text-center">
              <span className="text-3xl block mb-2">📊</span>
              <span className="text-base font-bold">Population Sort</span>
            </Link>
            <Link href="/games/capital-match" className="game-card p-5 border border-black/5 bg-white shadow-sm text-center">
              <span className="text-3xl block mb-2">🏛️</span>
              <span className="text-base font-bold">Capital Match</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Playing Phase ────────────────────────────────────────────────
  const picksRemaining = state.config.countries.length - state.currentStep;

  return (
    <div className="flex flex-col gap-5">
      {/* Session top bar */}
      <GameSessionTopBar
        mode={mode}
        scoreLabel="Score"
        scoreValue={String(runningScore)}
        progressCurrent={state.currentStep}
        progressTotal={state.config.countries.length}
        extraInfo={`${picksRemaining} pick${picksRemaining !== 1 ? "s" : ""} left`}
      />

      {/* Endgame ramp warning */}
      <EndgameRamp
        picksRemaining={picksRemaining}
        totalPicks={state.config.countries.length}
      />

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

      {/* Pick feedback */}
      <PickFeedback
        type={feedbackType}
        message={feedbackMsg}
        delta={feedbackDelta}
        triggerKey={feedbackKey}
      />

      {/* Hint */}
      <p className="text-center text-lg text-cream-muted">
        Which category should{" "}
        <span className="font-bold text-cream">{currentCountry?.displayName}</span>{" "}
        go in?
      </p>
    </div>
  );
}
